import fs from "node:fs/promises";
import path from "node:path";
import { FileStore } from "@tus/file-store";
import { EVENTS, Server } from "@tus/server";
import { tusUploadMetadataDto } from "@wedding-drop/db";
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
			const parseResult = tusUploadMetadataDto.safeParse(metadata);
			if (!parseResult.success) {
				throw {
					status_code: 400,
					body: "Błąd: Brak wymaganego parametru gallerySlug w metadanych.",
				};
			}
			return { metadata };
		},
	});

	server.on(EVENTS.POST_FINISH, async (_req, _res, upload) => {
		const parseResult = tusUploadMetadataDto.safeParse(upload.metadata || {});
		if (!parseResult.success) {
			console.warn(
				`[TUS] Pominięto przetwarzanie uploadu ${upload.id} - błąd metadanych:`,
				parseResult.error.flatten(),
			);
			return;
		}

		const {
			gallerySlug,
			uploaderName,
			originalName,
			fileType: mimeType,
		} = parseResult.data;
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
