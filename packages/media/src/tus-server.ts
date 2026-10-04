import fs from "node:fs/promises";
import path from "node:path";
import { FileStore } from "@tus/file-store";
import { EVENTS, Server } from "@tus/server";
import {
	db,
	galleries,
	mediaItems,
	tusUploadMetadataDto,
} from "@wedding-drop/db";
import { eq, sql } from "drizzle-orm";
import { scheduleMediaProcessing } from "./media-processor";

/**
 * Funkcja weryfikująca poświadczenia właściciela galerii, wstrzykiwana z `apps/web/server.ts`.
 * Utrzymuje to poprawny kierunek zależności monorepo (apps/web -> packages/media),
 * bez przenoszenia logiki HMAC (`verifyOwnerToken`) do tego pakietu.
 */
export type VerifyOwnerCredentials = (
	gallerySlug: string,
	ownerToken: string | undefined,
) => boolean | Promise<boolean>;

export interface TusServerOptions {
	verifyOwnerCredentials?: VerifyOwnerCredentials;
}

/**
 * Sprawdza, czy import fotografa mieści się w limicie `maxStorageBytes` galerii.
 * `maxStorageBytes === 0` oznacza brak limitu (zgodnie z konwencją kolumny w schemacie).
 * Dotyczy wyłącznie ścieżki importu fotografa - uploady gości nie są tu w żaden sposób ograniczane.
 */
async function checkPhotographerStorageLimit(
	gallerySlug: string,
	incomingFileSize: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
	const galleryResult = await db
		.select()
		.from(galleries)
		.where(eq(galleries.slug, gallerySlug))
		.limit(1);

	if (!galleryResult.length) {
		return { ok: false, message: "Błąd: Galeria nie istnieje." };
	}

	const gallery = galleryResult[0];
	if (!gallery.maxStorageBytes) {
		return { ok: true };
	}

	const usageResult = await db
		.select({
			totalBytes: sql<number>`COALESCE(sum(${mediaItems.fileSize}), 0)::bigint`,
		})
		.from(mediaItems)
		.where(eq(mediaItems.galleryId, gallery.id));

	const currentUsage = Number(usageResult[0]?.totalBytes || 0);
	if (currentUsage + incomingFileSize > gallery.maxStorageBytes) {
		return {
			ok: false,
			message:
				"Błąd: Import przekroczyłby limit pojemności dyskowej tej galerii.",
		};
	}

	return { ok: true };
}

export function initTusServer(dataDir: string, options: TusServerOptions = {}) {
	const { verifyOwnerCredentials } = options;
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

			const {
				gallerySlug,
				source,
				ownerToken,
				fileType: mimeType,
				originalName,
			} = parseResult.data;

			// Weryfikacja istnienia i aktywności galerii dla wszystkich uploadów (gości i fotografów)
			const galleryResult = await db
				.select()
				.from(galleries)
				.where(eq(galleries.slug, gallerySlug))
				.limit(1);

			if (!galleryResult.length) {
				throw {
					status_code: 404,
					body: "Błąd: Galeria nie istnieje.",
				};
			}

			const gallery = galleryResult[0];
			if (gallery.isActive === false) {
				throw {
					status_code: 403,
					body: "Błąd: Galeria jest obecnie wyłączona i nie przyjmuje nowych materiałów.",
				};
			}

			const isVideo =
				mimeType?.startsWith("video") ||
				/\.(mp4|mov|avi|webm)$/i.test(originalName || "");
			if (isVideo && gallery.allowVideos === false) {
				throw {
					status_code: 403,
					body: "Błąd: Wgrywanie filmów jest wyłączone w tej galerii.",
				};
			}

			if (source === "photographer") {
				// Import fotografa wymaga zawsze poprawnej autoryzacji właściciela.
				// Brak wstrzykniętej funkcji weryfikującej = bezpieczne domyślne odrzucenie.
				const isAuthorized = verifyOwnerCredentials
					? await verifyOwnerCredentials(gallerySlug, ownerToken)
					: false;

				if (!isAuthorized) {
					throw {
						status_code: 401,
						body: "Błąd: Import materiałów fotografa wymaga poprawnej autoryzacji właściciela galerii.",
					};
				}

				const sizeCheck = await checkPhotographerStorageLimit(
					gallerySlug,
					upload.size || 0,
				);
				if (!sizeCheck.ok) {
					throw {
						status_code: 413,
						body: sizeCheck.message,
					};
				}
			} else {
				// Upload gościa
				if (gallery.allowGuestUploads === false) {
					throw {
						status_code: 403,
						body: "Błąd: Przesyłanie plików przez gości jest wyłączone w tej galerii.",
					};
				}
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
			source,
		} = parseResult.data;
		const isVideo =
			mimeType.startsWith("video") ||
			/\.(mp4|mov|avi|webm)$/i.test(originalName);

		const tempFilePath = path.join(uploadDir, upload.id);

		console.log(
			`[TUS] Ukończono upload ${upload.id} dla galerii ${gallerySlug} (${upload.size} bajtów, źródło: ${source})`,
		);

		// Asynchroniczne przekazanie do kolejki obróbki - dokładnie ta sama, ograniczona
		// kolejka p-queue(2) co uploady gości, bez priorytetu dla importu fotografa.
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
			source,
		});
	});

	return server;
}
