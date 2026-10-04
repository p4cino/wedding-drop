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
import { classifyMedia } from "./media-kind";
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

/**
 * Sprawdza sesję gościa dla galerii chronionej hasłem (wstrzykiwana z `apps/web`,
 * bo HMAC sesji gościa żyje w `apps/web/src/lib/auth.ts`). Przyjmuje surowy nagłówek `Cookie`.
 */
export type VerifyGuestAccess = (
	gallerySlug: string,
	cookieHeader: string | undefined,
) => boolean;

/**
 * Limiter tworzenia uploadów (wstrzykiwany z `apps/web`). Zwraca liczbę sekund do ponowienia,
 * gdy limit przekroczony, albo null, gdy żądanie może przejść.
 */
export type UploadRateLimiter = (
	clientIp: string | null,
	gallerySlug: string,
) => number | null;

export interface TusServerOptions {
	verifyOwnerCredentials?: VerifyOwnerCredentials;
	verifyGuestAccess?: VerifyGuestAccess;
	checkUploadRateLimit?: UploadRateLimiter;
}

/** Maksymalny rozmiar pojedynczego pliku: 1 GiB. */
export const MAX_UPLOAD_SIZE_BYTES = 1024 * 1024 * 1024;

/** Osierocone (niewznowione) uploady starsze niż 24 h są usuwane z `tus_temp`. */
export const ORPHAN_UPLOAD_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const ORPHAN_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/** Usuwa z katalogu tymczasowego pliki nieruszane dłużej niż `maxAgeMs`. Zwraca liczbę usuniętych. */
export async function cleanupOrphanedUploads(
	uploadDir: string,
	maxAgeMs: number = ORPHAN_UPLOAD_MAX_AGE_MS,
	now: number = Date.now(),
): Promise<number> {
	let removed = 0;
	let entries: string[];
	try {
		entries = await fs.readdir(uploadDir);
	} catch {
		return 0;
	}
	for (const name of entries) {
		const full = path.join(uploadDir, name);
		try {
			const stat = await fs.stat(full);
			if (stat.isFile() && now - stat.mtimeMs > maxAgeMs) {
				await fs.unlink(full);
				removed += 1;
			}
		} catch {
			// plik zniknął między readdir a stat - ignorujemy
		}
	}
	return removed;
}

/**
 * Sprawdza, czy nowy plik mieści się w limicie `maxStorageBytes` galerii.
 * `maxStorageBytes === 0` oznacza brak limitu (zgodnie z konwencją kolumny w schemacie).
 * Dotyczy uploadów gości i importu fotografa.
 */
async function checkStorageLimit(
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
				"Błąd: Plik przekroczyłby limit pojemności dyskowej tej galerii.",
		};
	}

	return { ok: true };
}

export function initTusServer(dataDir: string, options: TusServerOptions = {}) {
	const { verifyOwnerCredentials, verifyGuestAccess, checkUploadRateLimit } =
		options;
	const uploadDir = path.join(dataDir, "tus_temp");
	// Zapewnienie istnienia katalogu tymczasowego
	fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

	// Cykliczne sprzątanie osieroconych uploadów (timer nie blokuje zamknięcia procesu)
	const cleanupTimer = setInterval(() => {
		cleanupOrphanedUploads(uploadDir).catch(console.error);
	}, ORPHAN_CLEANUP_INTERVAL_MS);
	cleanupTimer.unref?.();
	cleanupOrphanedUploads(uploadDir).catch(console.error);

	const server = new Server({
		path: "/api/upload/tus",
		relativeLocation: true,
		respectForwardedHeaders: true,
		maxSize: MAX_UPLOAD_SIZE_BYTES,
		datastore: new FileStore({ directory: uploadDir }),
		namingFunction: () => {
			const timestamp = Date.now();
			const random = Math.random().toString(36).substring(2, 8);
			return `upload_${timestamp}_${random}`;
		},
		onUploadCreate: async (req, upload) => {
			// Wymagamy zadeklarowanego rozmiaru - bez niego nie da się wyegzekwować limitu 1 GiB
			if (upload?.sizeIsDeferred) {
				throw {
					status_code: 400,
					body: "Błąd: Wymagany jest nagłówek Upload-Length.",
				};
			}

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

			const { mediaType: incomingKind } = classifyMedia(mimeType, originalName);
			if (incomingKind !== "photo" && gallery.allowVideos === false) {
				throw {
					status_code: 403,
					body: "Błąd: Wgrywanie filmów i nagrań jest wyłączone w tej galerii.",
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
			} else {
				// Upload gościa
				if (gallery.allowGuestUploads === false) {
					throw {
						status_code: 403,
						body: "Błąd: Przesyłanie plików przez gości jest wyłączone w tej galerii.",
					};
				}

				// Limit tworzenia uploadów dotyczy wyłącznie anonimowych gości
				if (checkUploadRateLimit) {
					const clientIp =
						req?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ||
						null;
					const retryAfter = checkUploadRateLimit(clientIp, gallerySlug);
					if (retryAfter !== null) {
						throw {
							status_code: 429,
							body: "Błąd: Zbyt wiele żądań. Spróbuj ponownie później.",
							headers: { "Retry-After": String(Math.max(1, retryAfter)) },
						};
					}
				}

				// Galeria chroniona hasłem wymaga sesji gościa; brak wstrzykniętej weryfikacji = odrzucenie
				if (gallery.guestPassword) {
					const cookieHeader = req?.headers?.get?.("cookie") ?? undefined;
					const hasAccess = verifyGuestAccess
						? verifyGuestAccess(gallerySlug, cookieHeader)
						: false;
					if (!hasAccess) {
						throw {
							status_code: 401,
							body: "Błąd: Ta galeria wymaga zalogowania hasłem gościa.",
						};
					}
				}
			}

			// Limit pojemności galerii obowiązuje gości i fotografa (0 = bez limitu)
			const sizeCheck = await checkStorageLimit(gallerySlug, upload.size || 0);
			if (!sizeCheck.ok) {
				throw {
					status_code: 413,
					body: sizeCheck.message,
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
			source,
		} = parseResult.data;
		const { fileType, mediaType } = classifyMedia(mimeType, originalName);

		const tempFilePath = path.join(uploadDir, upload.id);

		console.log(
			`[TUS] Ukończono upload ${upload.id} dla galerii ${gallerySlug} (${upload.size} bajtów, źródło: ${source}, mediaType: ${mediaType})`,
		);

		// Asynchroniczne przekazanie do kolejki obróbki - dokładnie ta sama, ograniczona
		// kolejka p-queue(2) co uploady gości, bez priorytetu dla importu fotografa.
		scheduleMediaProcessing({
			uploadId: upload.id,
			tempFilePath,
			gallerySlug,
			uploaderName,
			originalName,
			fileType,
			mimeType,
			mediaType,
			fileSize: upload.size || 0,
			dataDir,
			source,
		});
	});

	return server;
}
