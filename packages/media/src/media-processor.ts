import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { db, galleries, mediaItems } from "@wedding-drop/db";
import { eq, sql } from "drizzle-orm";
import PQueue from "p-queue";
import { validateMediaFile } from "./file-validator";
import { sseBus } from "./sse-bus";

// Ograniczenie współbieżności do 2 procesów naraz - krytyczne dla 4-rdzeniowego Intel N100!
export const mediaQueue = new PQueue({ concurrency: 2 });

const EXT_TO_MIME: Record<string, string> = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
	".gif": "image/gif",
	".heic": "image/heic",
	".heif": "image/heif",
	".mp4": "video/mp4",
	".mov": "video/quicktime",
	".webm": "video/webm",
	".avi": "video/x-msvideo",
	".mkv": "video/x-matroska",
	".mp3": "audio/mpeg",
	".wav": "audio/wav",
	".aac": "audio/aac",
	".m4a": "audio/mp4",
	".ogg": "audio/ogg",
	".oga": "audio/ogg",
	".opus": "audio/opus",
	".flac": "audio/flac",
};

function resolveCanonicalMimeType(
	clientMime: string,
	fileType: "image" | "video" | "audio",
	safeExt: string,
): string {
	const cleaned = clientMime.split(";")[0]?.trim().toLowerCase() || "";
	if (/^(image|video|audio)\/[a-z0-9.+-]+$/.test(cleaned)) {
		const prefix = cleaned.split("/")[0];
		if (prefix === fileType) {
			return cleaned;
		}
	}
	if (fileType === "audio" && safeExt === ".webm") return "audio/webm";
	if (fileType === "audio" && safeExt === ".mp4") return "audio/mp4";
	return (
		EXT_TO_MIME[safeExt] ||
		(fileType === "video"
			? "video/mp4"
			: fileType === "audio"
				? "audio/mpeg"
				: "image/jpeg")
	);
}

async function cleanupTusSidecarFiles(tempFilePath: string) {
	await fs.unlink(`${tempFilePath}.json`).catch(() => {});
	await fs.unlink(`${tempFilePath}.info`).catch(() => {});
}

export interface ProcessTask {
	uploadId: string;
	tempFilePath: string;
	gallerySlug: string;
	uploaderName: string;
	originalName: string;
	fileType: "image" | "video" | "audio";
	mimeType: string;
	mediaType?: "photo" | "video" | "audio";
	fileSize: number;
	dataDir: string;
	source?: "guest" | "photographer";
}

export async function scheduleMediaProcessing(task: ProcessTask) {
	return mediaQueue.add(() => processMediaTask(task));
}

async function processMediaTask(task: ProcessTask) {
	const {
		uploadId,
		tempFilePath,
		gallerySlug,
		uploaderName,
		originalName,
		fileType,
		mimeType,
		mediaType,
		fileSize,
		dataDir,
		source = "guest",
	} = task;

	try {
		// Weryfikacja sygnatury pliku i magic bytes przed przeniesieniem do galerii (ochrona przed Stored XSS)
		const validation = await validateMediaFile(
			tempFilePath,
			originalName,
			fileType,
		);
		if (!validation.valid) {
			console.warn(
				`[Processor] Odrzucono niebezpieczny plik ${originalName}: ${validation.error}`,
			);
			await fs.unlink(tempFilePath).catch(() => {});
			await cleanupTusSidecarFiles(tempFilePath);
			return;
		}

		const galleryResult = await db
			.select()
			.from(galleries)
			.where(eq(galleries.slug, gallerySlug))
			.limit(1);
		if (!galleryResult.length) {
			console.error(`[Processor] Galeria ${gallerySlug} nie istnieje.`);
			await fs.unlink(tempFilePath).catch(() => {});
			await cleanupTusSidecarFiles(tempFilePath);
			return;
		}
		const gallery = galleryResult[0];

		// Ponowna weryfikacja limitu pojemności w kolejce p-queue przed zapisem pliku (ochrona przed wyścigiem TOCTOU F-08)
		if (gallery.maxStorageBytes && gallery.maxStorageBytes > 0) {
			const usageQuery = db
				.select({
					totalBytes: sql<number>`COALESCE(sum(${mediaItems.fileSize}), 0)::bigint`,
				})
				.from(mediaItems)
				.where(eq(mediaItems.galleryId, gallery.id));
			const usageRows = await Promise.resolve(usageQuery).catch(() => []);
			const currentUsage = Array.isArray(usageRows)
				? Number(usageRows[0]?.totalBytes || 0)
				: 0;
			if (currentUsage + fileSize > gallery.maxStorageBytes) {
				console.warn(
					`[Processor] Odrzucono plik ${originalName} - przekroczono limit pojemności galerii ${gallerySlug}.`,
				);
				await fs.unlink(tempFilePath).catch(() => {});
				await cleanupTusSidecarFiles(tempFilePath);
				return;
			}
		}

		const rawDir = path.join(dataDir, "galleries", gallerySlug, "raw");
		const thumbsDir = path.join(dataDir, "galleries", gallerySlug, "thumbs");
		await fs.mkdir(rawDir, { recursive: true });
		await fs.mkdir(thumbsDir, { recursive: true });

		const safeExt = validation.safeExt;
		const rawFileName = `${uploadId}${safeExt}`;
		const targetRawPath = path.join(rawDir, rawFileName);
		const thumbFileName = `${uploadId}_thumb.webp`;
		const targetThumbPath = path.join(thumbsDir, thumbFileName);

		await fs.rename(tempFilePath, targetRawPath);
		await cleanupTusSidecarFiles(tempFilePath);

		const mediaProps =
			fileType === "image"
				? await processImage(targetRawPath, targetThumbPath)
				: fileType === "audio"
					? await processAudio()
					: await processVideo(targetRawPath, targetThumbPath);

		const relativeRaw = path.posix.join(
			"galleries",
			gallerySlug,
			"raw",
			rawFileName,
		);
		// Audio nie ma miniatury; kolumna jest NOT NULL, a UI pokazuje ikonę zamiast obrazka
		const relativeThumb =
			fileType !== "audio" && existsSync(targetThumbPath)
				? path.posix.join("galleries", gallerySlug, "thumbs", thumbFileName)
				: relativeRaw;

		const canonicalMimeType = resolveCanonicalMimeType(
			mimeType,
			fileType,
			safeExt,
		);

		const [newMedia] = await db
			.insert(mediaItems)
			.values({
				galleryId: gallery.id,
				uploaderName: uploaderName || "Gość weselny",
				fileType,
				mediaType:
					mediaType ||
					(fileType === "audio"
						? "audio"
						: fileType === "video"
							? "video"
							: "photo"),
				source,
				mimeType: canonicalMimeType,
				originalFileName: originalName,
				fileSize,
				storagePath: relativeRaw,
				thumbPath: relativeThumb,
				width: mediaProps.width,
				height: mediaProps.height,
				duration: mediaProps.duration,
				status:
					gallery.isApprovalQueueEnabled && source !== "photographer"
						? "pending"
						: "ready",
			})
			.returning();

		sseBus.notifyNewMedia(gallerySlug, newMedia);
	} catch (err) {
		console.error(`[Processor] Błąd krytyczny pliku ${originalName}:`, err);
	}
}

async function processImage(rawPath: string, thumbPath: string) {
	let width: number | null = null;
	let height: number | null = null;
	try {
		const sharp = (await import("sharp")).default;
		const image = sharp(rawPath, { failOn: "none" }).rotate();
		const metadata = await image.metadata();
		width = metadata.width || null;
		height = metadata.height || null;
		await image
			.resize(500, 500, { fit: "cover", position: "center" })
			.webp({ quality: 80 })
			.toFile(thumbPath);
	} catch (err) {
		console.error("[Processor] Sharp error:", err);
	}
	return { width, height, duration: null };
}

async function processVideo(rawPath: string, thumbPath: string) {
	try {
		await extractVideoThumbnail(rawPath, thumbPath);
	} catch (err) {
		console.warn("[Processor] FFmpeg error:", err);
	}
	return { width: null, height: null, duration: null };
}

async function processAudio() {
	return { width: null, height: null, duration: null };
}

function extractVideoThumbnail(
	videoPath: string,
	outputThumbPath: string,
	timeoutMs = 25000,
): Promise<void> {
	return new Promise((resolve, reject) => {
		let timer: NodeJS.Timeout | null = null;
		let isSettled = false;

		// ffmpeg -ss 00:00:01 -i input -vframes 1 -vf scale=500:500:force_original_aspect_ratio=increase,crop=500:500 -q:v 3 out.webp
		const ffmpeg = spawn("ffmpeg", [
			"-y",
			"-ss",
			"00:00:01",
			"-i",
			videoPath,
			"-vframes",
			"1",
			"-vf",
			"scale=500:500:force_original_aspect_ratio=increase,crop=500:500",
			outputThumbPath,
		]);

		timer = setTimeout(() => {
			if (!isSettled) {
				isSettled = true;
				ffmpeg.kill("SIGKILL");
				reject(new Error(`FFmpeg przekroczył limit czasu (${timeoutMs} ms)`));
			}
		}, timeoutMs);

		ffmpeg.on("close", (code) => {
			if (timer) clearTimeout(timer);
			if (isSettled) return;
			isSettled = true;
			if (code === 0) resolve();
			else reject(new Error(`FFmpeg exited with code ${code}`));
		});

		ffmpeg.on("error", (err) => {
			if (timer) clearTimeout(timer);
			if (isSettled) return;
			isSettled = true;
			reject(err);
		});
	});
}
