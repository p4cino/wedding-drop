import fs from "node:fs";
import path from "node:path";
import {
	db,
	type Gallery,
	galleries,
	galleryGdriveExports,
	mediaItems,
} from "@wedding-drop/db";
import { and, eq, type InferSelectModel, ne } from "drizzle-orm";
import PQueue from "p-queue";
import {
	checkStorageQuota,
	ensureDriveFolder,
	getDriveClientForGallery,
	uploadFileToDrive,
} from "./google-drive";
import { sseBus } from "./sse-bus";

export interface ExportProgress {
	totalFiles: number;
	processedFiles: number;
	totalBytes: number;
	processedBytes: number;
	currentFile: string;
	error: string | null;
}

/**
 * Procedura Startup Recovery: przestawia wiszące zadania 'running' na 'interrupted' po restarcie serwera
 */
export async function recoverInterruptedExports() {
	try {
		await db
			.update(galleryGdriveExports)
			.set({ exportStatus: "interrupted" })
			.where(eq(galleryGdriveExports.exportStatus, "running"));
		console.log(
			"Startup Recovery: Sprawdzono przerwane zadania eksportu Google Drive.",
		);
	} catch (err) {
		console.error(
			"Błąd podczas recovery przerwanych eksportów Google Drive:",
			err,
		);
	}
}

/**
 * Uruchamia asynchroniczny eksport multimediów galerii na Dysk Google
 */
export async function startGalleryDriveExport(
	slug: string,
	options: { includeHidden?: boolean } = {},
): Promise<{ success: boolean; message?: string; alreadyRunning?: boolean }> {
	const galleryResult = await db
		.select({
			gallery: galleries,
			gdrive: galleryGdriveExports,
		})
		.from(galleries)
		.leftJoin(
			galleryGdriveExports,
			eq(galleries.id, galleryGdriveExports.galleryId),
		)
		.where(eq(galleries.slug, slug))
		.limit(1);

	if (!galleryResult.length) {
		throw new Error("Galeria nie istnieje");
	}

	const { gallery, gdrive } = galleryResult[0];

	if (!gdrive?.refreshToken) {
		throw new Error("Dysk Google nie jest podłączony do tej galerii.");
	}

	if (gdrive.exportStatus === "running") {
		return {
			success: false,
			alreadyRunning: true,
			message: "Eksport jest już w trakcie realizacji.",
		};
	}

	// Uruchomienie w tle (bez blokowania odpowiedzi HTTP)
	runExportTask(gallery, gdrive, options).catch((err) => {
		console.error(
			`Nieobsłużony błąd w zadaniu eksportu Google Drive dla galerii ${slug}:`,
			err,
		);
	});

	return { success: true, message: "Rozpoczęto eksport na Dysk Google." };
}

/**
 * Wewnętrzna funkcja realizująca transfer w tle
 */
async function runExportTask(
	gallery: Gallery,
	gdrive: InferSelectModel<typeof galleryGdriveExports>,
	options: { includeHidden?: boolean },
) {
	const slug = gallery.slug;
	const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");

	try {
		// 1. Zmiana statusu na 'running'
		await db
			.update(galleryGdriveExports)
			.set({
				exportStatus: "running",
				exportProgress: {
					totalFiles: 0,
					processedFiles: 0,
					totalBytes: 0,
					processedBytes: 0,
					currentFile: "Inicjalizacja połączenia z Google Drive...",
					error: null,
				},
			})
			.where(eq(galleryGdriveExports.galleryId, gallery.id));

		sseBus.notifyGDriveProgress(slug, {
			status: "running",
			message: "Inicjalizacja połączenia z Google Drive...",
		});

		// 2. Pobranie klienta i plików do wysłania
		if (!gdrive.refreshToken) {
			throw new Error("Missing refreshToken in export task");
		}
		const drive = getDriveClientForGallery(gdrive.refreshToken);

		const allItems = await db
			.select()
			.from(mediaItems)
			.where(
				and(
					eq(mediaItems.galleryId, gallery.id),
					ne(mediaItems.status, "deleted"),
				),
			);

		const itemsToExport = allItems.filter((item) => {
			if (!options.includeHidden && item.status === "hidden") {
				return false;
			}
			return true;
		});

		if (itemsToExport.length === 0) {
			await db
				.update(galleryGdriveExports)
				.set({
					exportStatus: "completed",
					exportedAt: new Date(),
					exportProgress: {
						totalFiles: 0,
						processedFiles: 0,
						totalBytes: 0,
						processedBytes: 0,
						currentFile: "",
						error: null,
					},
				})
				.where(eq(galleryGdriveExports.galleryId, gallery.id));

			sseBus.notifyGDriveProgress(slug, {
				status: "completed",
				processedFiles: 0,
				totalFiles: 0,
			});
			return;
		}

		// 3. Pre-flight Quota Check: czy użytkownik ma wystarczająco miejsca na Dysku Google?
		const unuploadedItems = itemsToExport.filter((item) => !item.gdriveFileId);
		const bytesNeeded = unuploadedItems.reduce(
			(sum, item) => sum + Number(item.fileSize),
			0,
		);

		const quota = await checkStorageQuota(drive);
		if (quota.freeBytes < bytesNeeded) {
			const freeMB = (quota.freeBytes / (1024 * 1024)).toFixed(1);
			const neededMB = (bytesNeeded / (1024 * 1024)).toFixed(1);
			const errorMsg = `Brak miejsca na Dysku Google. Wymagane: ${neededMB} MB, Dostępne: ${freeMB} MB.`;

			await db
				.update(galleryGdriveExports)
				.set({
					exportStatus: "failed",
					exportProgress: {
						totalFiles: itemsToExport.length,
						processedFiles: 0,
						totalBytes: bytesNeeded,
						processedBytes: 0,
						currentFile: "",
						error: errorMsg,
					},
				})
				.where(eq(galleryGdriveExports.galleryId, gallery.id));

			sseBus.notifyGDriveProgress(slug, { status: "failed", error: errorMsg });
			return;
		}

		// 4. Przygotowanie struktury folderów (zabezpieczenie przed duplikatami)
		const rootFolderName = `WeddingDrop - ${gallery.coupleNames}`;
		const rootFolderId =
			gdrive.rootFolderId || (await ensureDriveFolder(drive, rootFolderName));

		const photosFolderId =
			gdrive.photosFolderId ||
			(await ensureDriveFolder(drive, "Zdjęcia", rootFolderId));

		const videosFolderId =
			gdrive.videosFolderId ||
			(await ensureDriveFolder(drive, "Filmy", rootFolderId));

		let hiddenFolderId = gdrive.hiddenFolderId;
		const hasHidden = itemsToExport.some((i) => i.status === "hidden");
		if (hasHidden && !hiddenFolderId) {
			hiddenFolderId = await ensureDriveFolder(drive, "Ukryte", rootFolderId);
		}

		// Zapisujemy ID folderów w bazie, aby nigdy nie tworzyć ich ponownie
		await db
			.update(galleryGdriveExports)
			.set({
				rootFolderId: rootFolderId,
				photosFolderId: photosFolderId,
				videosFolderId: videosFolderId,
				hiddenFolderId: hiddenFolderId || null,
			})
			.where(eq(galleryGdriveExports.galleryId, gallery.id));

		// 5. Śledzenie postępu i kolejka p-queue z concurrency: 2
		let processedFiles = itemsToExport.filter((i) =>
			Boolean(i.gdriveFileId),
		).length;
		let processedBytes = itemsToExport
			.filter((i) => Boolean(i.gdriveFileId))
			.reduce((sum, i) => sum + Number(i.fileSize), 0);

		const totalFiles = itemsToExport.length;
		const totalBytes = itemsToExport.reduce(
			(sum, i) => sum + Number(i.fileSize),
			0,
		);

		const updateDbProgress = async (currentFileName: string) => {
			const progressObj: ExportProgress = {
				totalFiles,
				processedFiles,
				totalBytes,
				processedBytes,
				currentFile: currentFileName,
				error: null,
			};

			await db
				.update(galleryGdriveExports)
				.set({
					exportProgress: progressObj,
				})
				.where(eq(galleryGdriveExports.galleryId, gallery.id));

			sseBus.notifyGDriveProgress(slug, {
				status: "running",
				...progressObj,
			});
		};

		const queue = new PQueue({ concurrency: 2 });

		for (const item of itemsToExport) {
			// Jeśli plik już wcześniej przesłano (idempotentność), pomijamy go
			if (item.gdriveFileId) {
				continue;
			}

			queue.add(async () => {
				const localPath = path.join(
					/*turbopackIgnore: true*/ dataDir,
					item.storagePath,
				);
				if (!fs.existsSync(/*turbopackIgnore: true*/ localPath)) {
					console.warn(`Plik lokalny nie istnieje: ${localPath}`);
					return;
				}

				// Wybór folderu docelowego
				let targetFolder = photosFolderId;
				if (item.status === "hidden") {
					targetFolder = hiddenFolderId || photosFolderId;
				} else if (item.fileType === "video") {
					targetFolder = videosFolderId;
				}

				// Przyjazna, bezkolizyjna nazwa pliku: [Gość]_nazwa_pliku.ext
				const cleanUploader = item.uploaderName.replace(/[/\\?%*:|"<>]/g, "_");
				const cleanFileName = item.originalFileName.replace(
					/[/\\?%*:|"<>]/g,
					"_",
				);
				const driveFileName = `[${cleanUploader}]_${cleanFileName}`;

				await updateDbProgress(driveFileName);

				// Upload ze strumieniem
				const driveFileId = await uploadFileToDrive(
					drive,
					localPath,
					driveFileName,
					item.mimeType,
					targetFolder,
				);

				// Zapis ID w bazie dla idempotentności
				await db
					.update(mediaItems)
					.set({ gdriveFileId: driveFileId })
					.where(eq(mediaItems.id, item.id));

				processedFiles++;
				processedBytes += Number(item.fileSize);
				await updateDbProgress(driveFileName);
			});
		}

		await queue.onIdle();

		// 6. Zakończenie sukcesem
		const finalProgress: ExportProgress = {
			totalFiles,
			processedFiles: totalFiles,
			totalBytes,
			processedBytes: totalBytes,
			currentFile: "",
			error: null,
		};

		await db
			.update(galleryGdriveExports)
			.set({
				exportStatus: "completed",
				exportedAt: new Date(),
				exportProgress: finalProgress,
			})
			.where(eq(galleryGdriveExports.galleryId, gallery.id));

		sseBus.notifyGDriveProgress(slug, {
			status: "completed",
			rootFolderId,
			...finalProgress,
		});
	} catch (err: unknown) {
		console.error(
			`Błąd podczas eksportu na Google Drive (galeria: ${slug}):`,
			err,
		);
		const errorMsg =
			err instanceof Error ? err.message : "Wystąpił błąd podczas eksportu.";

		await db
			.update(galleryGdriveExports)
			.set({
				exportStatus: "failed",
				exportProgress: {
					totalFiles: 0,
					processedFiles: 0,
					totalBytes: 0,
					processedBytes: 0,
					currentFile: "",
					error: errorMsg,
				},
			})
			.where(eq(galleryGdriveExports.galleryId, gallery.id));

		sseBus.notifyGDriveProgress(slug, {
			status: "failed",
			error: errorMsg,
		});
	}
}
