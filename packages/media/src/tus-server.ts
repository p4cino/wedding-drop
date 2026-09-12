import fs from "node:fs/promises";
import path from "node:path";
import { FileStore } from "@tus/file-store";
import { EVENTS, Server } from "@tus/server";
import { scheduleMediaProcessing } from "./media-processor";

export function initTusServer(dataDir: string) {
	const uploadDir = path.join(dataDir, "tus_temp");
	// Zapewnienie istnienia katalogu tymczasowego
	fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

	const server = new Server({
		path: "/api/upload/tus",
		relativeLocation: true,
		respectForwardedHeaders: true,
		datastore: new FileStore({ directory: uploadDir }),
		namingFunction: () => {
			const timestamp = Date.now();
			const random = Math.random().toString(36).substring(2, 8);
			return `upload_${timestamp}_${random}`;
		},
		onUploadCreate: async (_req, upload) => {
			const metadata = upload.metadata || {};
			const gallerySlug = metadata.gallerySlug;
			if (!gallerySlug) {
				throw {
					status_code: 400,
					body: "Błąd: Brak wymaganego parametru gallerySlug w metadanych.",
				};
			}
			return { metadata };
		},
	});

	server.on(EVENTS.POST_FINISH, async (_req, _res, upload) => {
		const meta = upload.metadata || {};
		const gallerySlug = meta.gallerySlug;
		if (!gallerySlug) {
			console.warn(
				`[TUS] Pominięto przetwarzanie uploadu ${upload.id} - brak gallerySlug`,
			);
			return;
		}
		const uploaderName = meta.uploaderName || "Gość weselny";
		const originalName = meta.originalName || "plik";
		const mimeType = meta.fileType || "image/jpeg";
		const isVideo =
			mimeType.startsWith("video") ||
			/\.(mp4|mov|avi|webm)$/i.test(originalName);

		const tempFilePath = path.join(uploadDir, upload.id);

		console.log(
			`[TUS] Ukończono upload ${upload.id} dla galerii ${gallerySlug} (${upload.size} bajtów)`,
		);

		// Asynchroniczne przekazanie do kolejki obróbki
		scheduleMediaProcessing({
			uploadId: upload.id,
			tempFilePath,
			gallerySlug,
			uploaderName,
			originalName,
			fileType: isVideo ? "video" : "image",
			mimeType,
			fileSize: upload.size || 0,
			dataDir,
		});
	});

	return server;
}
