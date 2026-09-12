import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	recoverInterruptedExports,
	startGalleryDriveExport,
} from "../src/gdrive-exporter";
import { sseBus } from "../src/sse-bus";

// Flexible DB Mock
let mockGalleriesResult: unknown[] = [];
let mockMediaResult: unknown[] = [];
const mockDbUpdateSet = vi.fn();

vi.mock("@wedding-drop/db", () => {
	const mockUpdate = vi.fn(() => ({
		set: mockDbUpdateSet.mockImplementation(() => ({
			where: vi.fn().mockResolvedValue([]),
		})),
	}));

	const mockSelect = vi.fn(() => ({
		from: vi.fn((table) => ({
			where: vi.fn(() => {
				const isGalleries =
					String(table?.slug || "").includes("galleries") ||
					table === "galleries.slug";
				const currentData = isGalleries ? mockGalleriesResult : mockMediaResult;
				const promise = Promise.resolve(currentData);
				(promise as unknown as { limit: unknown }).limit = vi
					.fn()
					.mockResolvedValue(currentData);
				return promise;
			}),
		})),
	}));

	return {
		db: {
			update: mockUpdate,
			select: mockSelect,
		},
		galleries: {
			id: "galleries.id",
			slug: "galleries.slug",
			gdriveExportStatus: "galleries.gdriveExportStatus",
		},
		mediaItems: {
			id: "mediaItems.id",
			galleryId: "mediaItems.galleryId",
			status: "mediaItems.status",
		},
	};
});

// Mock google-drive module
vi.mock("../src/google-drive", () => ({
	getDriveClientForGallery: vi.fn().mockReturnValue({}),
	checkStorageQuota: vi.fn().mockResolvedValue({
		limitBytes: 15000000000,
		usageBytes: 1000000000,
		freeBytes: 14000000000,
	}),
	ensureDriveFolder: vi.fn().mockResolvedValue("mock-folder-id"),
	uploadFileToDrive: vi.fn().mockResolvedValue("mock-gdrive-file-id"),
}));

describe("GDrive Exporter Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGalleriesResult = [];
		mockMediaResult = [];
	});

	it("powinien przywrócić przerwane zadania eksportu po restarcie serwera (recoverInterruptedExports)", async () => {
		await recoverInterruptedExports();
		const { db } = await import("@wedding-drop/db");
		expect(db.update).toHaveBeenCalled();
	});

	it("powinien rzucić błąd, gdy galeria nie istnieje", async () => {
		mockGalleriesResult = [];

		await expect(startGalleryDriveExport("nieistniejaca")).rejects.toThrow(
			/Galeria nie istnieje/,
		);
	});

	it("powinien rzucić błąd, gdy galeria nie ma podłączonego Dysku Google", async () => {
		mockGalleriesResult = [
			{
				id: "gal-1",
				slug: "wesele-ani",
				gdriveRefreshToken: null,
			},
		];

		await expect(startGalleryDriveExport("wesele-ani")).rejects.toThrow(
			/Dysk Google nie jest podłączony/,
		);
	});

	it("powinien zwrócić alreadyRunning: true, gdy eksport jest już w toku", async () => {
		mockGalleriesResult = [
			{
				id: "gal-1",
				slug: "wesele-ani",
				gdriveRefreshToken: "token-123",
				gdriveExportStatus: "running",
			},
		];

		const result = await startGalleryDriveExport("wesele-ani");
		expect(result.success).toBe(false);
		expect(result.alreadyRunning).toBe(true);
	});

	it("powinien pomyślnie uruchomić zadanie w tle i obsłużyć brak plików do eksportu", async () => {
		const sseSpy = vi.spyOn(sseBus, "notifyGDriveProgress");

		mockGalleriesResult = [
			{
				id: "gal-1",
				slug: "pusta-galeria",
				coupleNames: "Kasia i Tomek",
				gdriveRefreshToken: "token-123",
				gdriveExportStatus: "idle",
			},
		];

		mockMediaResult = [];

		const result = await startGalleryDriveExport("pusta-galeria");
		expect(result.success).toBe(true);

		await new Promise((resolve) => setTimeout(resolve, 80));

		expect(sseSpy).toHaveBeenCalledWith(
			"pusta-galeria",
			expect.objectContaining({
				status: "completed",
				totalFiles: 0,
			}),
		);

		sseSpy.mockRestore();
	});

	it("powinien obsłużyć błąd braku miejsca na koncie Google Drive (Pre-flight Quota)", async () => {
		const googleDriveMod = await import("../src/google-drive");
		vi.mocked(googleDriveMod.checkStorageQuota).mockResolvedValueOnce({
			limitBytes: 1000,
			usageBytes: 900,
			freeBytes: 100,
		});

		mockGalleriesResult = [
			{
				id: "gal-1",
				slug: "duzo-danych",
				coupleNames: "Marta i Piotr",
				gdriveRefreshToken: "token-123",
				gdriveExportStatus: "idle",
			},
		];

		mockMediaResult = [
			{
				id: "m-1",
				galleryId: "gal-1",
				fileSize: 5000,
				status: "ready",
				uploaderName: "Gość",
				originalFileName: "plik.jpg",
				gdriveFileId: null,
			},
		];

		const sseSpy = vi.spyOn(sseBus, "notifyGDriveProgress");

		await startGalleryDriveExport("duzo-danych");
		await new Promise((resolve) => setTimeout(resolve, 80));

		expect(sseSpy).toHaveBeenCalledWith(
			"duzo-danych",
			expect.objectContaining({
				status: "failed",
				error: expect.stringContaining("Brak miejsca na Dysku Google"),
			}),
		);

		sseSpy.mockRestore();
	});

	it("powinien pomyślnie przetransferować multimedia na Dysk Google wraz z plikami ukrytymi (includeHidden)", async () => {
		const existsSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);

		mockGalleriesResult = [
			{
				id: "gal-1",
				slug: "pelna-galeria",
				coupleNames: "Ewa i Adam",
				gdriveRefreshToken: "token-123",
				gdriveExportStatus: "idle",
				gdriveRootFolderId: null,
				gdrivePhotosFolderId: null,
				gdriveVideosFolderId: null,
				gdriveHiddenFolderId: null,
			},
		];

		mockMediaResult = [
			{
				id: "m-1",
				galleryId: "gal-1",
				uploaderName: "Gość Adam",
				originalFileName: "foto.jpg",
				fileType: "image",
				mimeType: "image/jpeg",
				storagePath: "foto.jpg",
				fileSize: 1024,
				status: "ready",
				gdriveFileId: null,
			},
			{
				id: "m-2",
				galleryId: "gal-1",
				uploaderName: "Kamerzysta",
				originalFileName: "toast.mp4",
				fileType: "video",
				mimeType: "video/mp4",
				storagePath: "toast.mp4",
				fileSize: 4096,
				status: "ready",
				gdriveFileId: "already-uploaded-gdrive-id",
			},
			{
				id: "m-3",
				galleryId: "gal-1",
				uploaderName: "Świadek",
				originalFileName: "ukryte_foto.jpg",
				fileType: "image",
				mimeType: "image/jpeg",
				storagePath: "ukryte.jpg",
				fileSize: 2048,
				status: "hidden",
				gdriveFileId: null,
			},
		];

		const sseSpy = vi.spyOn(sseBus, "notifyGDriveProgress");

		await startGalleryDriveExport("pelna-galeria", { includeHidden: true });
		await new Promise((resolve) => setTimeout(resolve, 120));

		expect(sseSpy).toHaveBeenCalledWith(
			"pelna-galeria",
			expect.objectContaining({
				status: "completed",
			}),
		);

		existsSpy.mockRestore();
		sseSpy.mockRestore();
	});

	it("powinien obsłużyć błąd krytyczny transferu i zaktualizować status galerii na failed", async () => {
		const googleDriveMod = await import("../src/google-drive");
		vi.mocked(googleDriveMod.getDriveClientForGallery).mockImplementationOnce(
			() => {
				throw new Error("Token refresh error from Google");
			},
		);

		mockGalleriesResult = [
			{
				id: "gal-err",
				slug: "galeria-blad",
				coupleNames: "Anna i Jan",
				gdriveRefreshToken: "invalid-token",
				gdriveExportStatus: "idle",
			},
		];

		mockMediaResult = [
			{
				id: "m-1",
				galleryId: "gal-err",
				uploaderName: "Gość",
				originalFileName: "plik.jpg",
				status: "ready",
				fileSize: 100,
			},
		];

		const sseSpy = vi.spyOn(sseBus, "notifyGDriveProgress");
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await startGalleryDriveExport("galeria-blad");
		await new Promise((resolve) => setTimeout(resolve, 80));

		expect(sseSpy).toHaveBeenCalledWith(
			"galeria-blad",
			expect.objectContaining({
				status: "failed",
				error: expect.stringContaining("Token refresh error"),
			}),
		);

		consoleErrorSpy.mockRestore();
		sseSpy.mockRestore();
	});
});
