import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { db, galleries, mediaItems } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import PQueue from "p-queue";
import { sseBus } from "./sse-bus";

// Ograniczenie współbieżności do 2 procesów naraz - krytyczne dla 4-rdzeniowego Intel N100!
export const mediaQueue = new PQueue({ concurrency: 2 });

export interface ProcessTask {
	uploadId: string;
	tempFilePath: string;
	gallerySlug: string;
	uploaderName: string;
	originalName: string;
	fileType: "image" | "video";
	mimeType: string;
	fileSize: number;
	dataDir: string;
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
		fileSize,
		dataDir,
	} = task;

	try {
		const galleryResult = await db
			.select()
			.from(galleries)
			.where(eq(galleries.slug, gallerySlug))
			.limit(1);
		if (!galleryResult.length) {
			console.error(`[Processor] Galeria ${gallerySlug} nie istnieje.`);
			await fs.unlink(tempFilePath).catch(() => {});
			return;
		}
		const gallery = galleryResult[0];

		const rawDir = path.join(dataDir, "galleries", gallerySlug, "raw");
		const thumbsDir = path.join(dataDir, "galleries", gallerySlug, "thumbs");
		await fs.mkdir(rawDir, { recursive: true });
		await fs.mkdir(thumbsDir, { recursive: true });

		const safeExt =
			path.extname(originalName) || (fileType === "video" ? ".mp4" : ".jpg");
		const rawFileName = `${uploadId}${safeExt}`;
		const targetRawPath = path.join(rawDir, rawFileName);
		const thumbFileName = `${uploadId}_thumb.webp`;
		const targetThumbPath = path.join(thumbsDir, thumbFileName);

		await fs.rename(tempFilePath, targetRawPath);

		const mediaProps =
			fileType === "image"
				? await processImage(targetRawPath, targetThumbPath)
				: await processVideo(targetRawPath, targetThumbPath);

		const relativeRaw = path.posix.join(
			"galleries",
			gallerySlug,
			"raw",
			rawFileName,
		);
		const relativeThumb = existsSync(targetThumbPath)
			? path.posix.join("galleries", gallerySlug, "thumbs", thumbFileName)
			: relativeRaw;

		const [newMedia] = await db
			.insert(mediaItems)
			.values({
				galleryId: gallery.id,
				uploaderName: uploaderName || "Gość weselny",
				fileType,
				mimeType:
					mimeType || (fileType === "video" ? "video/mp4" : "image/jpeg"),
				originalFileName: originalName,
				fileSize,
				storagePath: relativeRaw,
				thumbPath: relativeThumb,
				width: mediaProps.width,
				height: mediaProps.height,
				duration: mediaProps.duration,
				status: "ready",
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
