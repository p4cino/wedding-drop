import os from "node:os";
import path from "node:path";
import { EVENTS } from "@tus/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { scheduleMediaProcessing } from "../src/media-processor.js";
import { initTusServer } from "../src/tus-server.js";

vi.mock("../src/media-processor.js", () => ({
	scheduleMediaProcessing: vi.fn(),
}));

let mockGalleryResult: unknown[] = [{ id: "gal-1", maxStorageBytes: 0 }];
let mockUsageResult: unknown[] = [{ totalBytes: 0 }];

vi.mock("@wedding-drop/db", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		db: {
			select: vi.fn((selection?: unknown) => {
				if (selection) {
					// Zapytanie sumujące zużycie miejsca (bez .limit(), await bezpośrednio na .where())
					return {
						from: vi.fn(() => ({
							where: vi.fn(() => Promise.resolve(mockUsageResult)),
						})),
					};
				}
				// Zapytanie o galerię (z .limit(1))
				return {
					from: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn(() => Promise.resolve(mockGalleryResult)),
						})),
					})),
				};
			}),
		},
	};
});

describe("tus-server configuration", () => {
	const tempDir = path.join(os.tmpdir(), "wedding-drop-test-tus");

	beforeEach(() => {
		vi.clearAllMocks();
		mockGalleryResult = [{ id: "gal-1", maxStorageBytes: 0 }];
		mockUsageResult = [{ totalBytes: 0 }];
	});

	it("powinien pomyślnie zainicjalizować instancję serwera TUS i wygenerować unikalną nazwę", () => {
		const server = initTusServer(tempDir);
		expect(server).toBeDefined();
		expect(server.options.path).toBe("/api/upload/tus");
		expect(server.options.relativeLocation).toBe(true);
		expect(server.options.respectForwardedHeaders).toBe(true);

		const namingFn = server.options.namingFunction;
		expect(namingFn).toBeDefined();
		if (namingFn) {
			const generatedName = namingFn({} as never);
			expect(generatedName).toMatch(/^upload_\d+_[a-z0-9]+$/);
		}
	});

	it("onUploadCreate powinien rzucać błąd 400, gdy brak gallerySlug w metadanych", async () => {
		const server = initTusServer(tempDir);
		const onUploadCreate = server.options.onUploadCreate;
		expect(onUploadCreate).toBeDefined();

		if (onUploadCreate) {
			await expect(
				onUploadCreate({} as never, { metadata: {} } as never),
			).rejects.toEqual({
				status_code: 400,
				body: "Błąd: Brak wymaganego parametru gallerySlug w metadanych.",
			});

			await expect(onUploadCreate({} as never, {} as never)).rejects.toEqual({
				status_code: 400,
				body: "Błąd: Brak wymaganego parametru gallerySlug w metadanych.",
			});
		}
	});

	it("onUploadCreate powinien akceptować upload z obecnym gallerySlug", async () => {
		const server = initTusServer(tempDir);
		const onUploadCreate = server.options.onUploadCreate;

		if (onUploadCreate) {
			const res = await onUploadCreate(
				{} as never,
				{ metadata: { gallerySlug: "kasia-i-tomek" } } as never,
			);
			expect(res).toEqual({ metadata: { gallerySlug: "kasia-i-tomek" } });
		}
	});

	describe("onUploadCreate - import fotografa (source: photographer)", () => {
		it("powinien odrzucić upload fotografa (401), gdy nie wstrzyknięto funkcji weryfikującej", async () => {
			const server = initTusServer(tempDir);
			const onUploadCreate = server.options.onUploadCreate;
			expect(onUploadCreate).toBeDefined();

			if (onUploadCreate) {
				await expect(
					onUploadCreate(
						{} as never,
						{
							size: 1000,
							metadata: {
								gallerySlug: "kasia-i-tomek",
								source: "photographer",
								ownerToken: "owner_123_abc_deadbeef",
							},
						} as never,
					),
				).rejects.toMatchObject({ status_code: 401 });
			}
		});

		it("powinien odrzucić upload fotografa (401), gdy funkcja weryfikująca zwraca false (zły/brak tokenu)", async () => {
			const verifyOwnerCredentials = vi.fn().mockReturnValue(false);
			const server = initTusServer(tempDir, { verifyOwnerCredentials });
			const onUploadCreate = server.options.onUploadCreate;

			if (onUploadCreate) {
				await expect(
					onUploadCreate(
						{} as never,
						{
							size: 1000,
							metadata: {
								gallerySlug: "kasia-i-tomek",
								source: "photographer",
								ownerToken: "zly-token",
							},
						} as never,
					),
				).rejects.toMatchObject({ status_code: 401 });
				expect(verifyOwnerCredentials).toHaveBeenCalledWith(
					"kasia-i-tomek",
					"zly-token",
				);
			}
		});

		it("powinien zaakceptować upload fotografa, gdy autoryzacja się powiedzie i mieści się w limicie", async () => {
			mockGalleryResult = [{ id: "gal-1", maxStorageBytes: 0 }];
			const verifyOwnerCredentials = vi.fn().mockReturnValue(true);
			const server = initTusServer(tempDir, { verifyOwnerCredentials });
			const onUploadCreate = server.options.onUploadCreate;

			if (onUploadCreate) {
				const res = await onUploadCreate(
					{} as never,
					{
						size: 5_000_000,
						metadata: {
							gallerySlug: "kasia-i-tomek",
							source: "photographer",
							ownerToken: "owner_123_abc_deadbeef",
						},
					} as never,
				);
				expect(res).toEqual({
					metadata: {
						gallerySlug: "kasia-i-tomek",
						source: "photographer",
						ownerToken: "owner_123_abc_deadbeef",
					},
				});
			}
		});

		it("powinien odrzucić import fotografa przekraczający maxStorageBytes (413), nie przerywając innych plików", async () => {
			mockGalleryResult = [{ id: "gal-1", maxStorageBytes: 1000 }];
			mockUsageResult = [{ totalBytes: 900 }];
			const verifyOwnerCredentials = vi.fn().mockReturnValue(true);
			const server = initTusServer(tempDir, { verifyOwnerCredentials });
			const onUploadCreate = server.options.onUploadCreate;

			if (onUploadCreate) {
				await expect(
					onUploadCreate(
						{} as never,
						{
							size: 500,
							metadata: {
								gallerySlug: "kasia-i-tomek",
								source: "photographer",
								ownerToken: "owner_123_abc_deadbeef",
							},
						} as never,
					),
				).rejects.toMatchObject({ status_code: 413 });
			}
		});

		it("powinien zaakceptować import fotografa, gdy maxStorageBytes=0 (brak limitu), niezależnie od rozmiaru", async () => {
			mockGalleryResult = [{ id: "gal-1", maxStorageBytes: 0 }];
			mockUsageResult = [{ totalBytes: 999_999_999 }];
			const verifyOwnerCredentials = vi.fn().mockReturnValue(true);
			const server = initTusServer(tempDir, { verifyOwnerCredentials });
			const onUploadCreate = server.options.onUploadCreate;

			if (onUploadCreate) {
				await expect(
					onUploadCreate(
						{} as never,
						{
							size: 5_000_000_000,
							metadata: {
								gallerySlug: "kasia-i-tomek",
								source: "photographer",
								ownerToken: "owner_123_abc_deadbeef",
							},
						} as never,
					),
				).resolves.toBeDefined();
			}
		});

		it("powinien odrzucić import fotografa (413), gdy suma zużycia i nowego pliku dokładnie przekracza limit o 1 bajt", async () => {
			mockGalleryResult = [{ id: "gal-1", maxStorageBytes: 1000 }];
			mockUsageResult = [{ totalBytes: 500 }];
			const verifyOwnerCredentials = vi.fn().mockReturnValue(true);
			const server = initTusServer(tempDir, { verifyOwnerCredentials });
			const onUploadCreate = server.options.onUploadCreate;

			if (onUploadCreate) {
				await expect(
					onUploadCreate(
						{} as never,
						{
							size: 501,
							metadata: {
								gallerySlug: "kasia-i-tomek",
								source: "photographer",
								ownerToken: "owner_123_abc_deadbeef",
							},
						} as never,
					),
				).rejects.toMatchObject({ status_code: 413 });
			}
		});

		it("powinien odrzucić tylko plik przekraczający limit w paczce importu, bez wpływu na pozostałe pliki tej samej sesji", async () => {
			// tus-js-client traktuje każdy plik importu jako osobny upload (osobne wywołanie onUploadCreate),
			// więc odrzucenie jednego pliku nie może przerwać przetwarzania pozostałych - patrz design.md.
			mockGalleryResult = [{ id: "gal-1", maxStorageBytes: 1000 }];
			const verifyOwnerCredentials = vi.fn().mockReturnValue(true);
			const server = initTusServer(tempDir, { verifyOwnerCredentials });
			const onUploadCreate = server.options.onUploadCreate;
			expect(onUploadCreate).toBeDefined();
			if (!onUploadCreate) return;

			// Plik 1 tej samej paczki: mieści się w limicie (usage 0 + 400 <= 1000)
			mockUsageResult = [{ totalBytes: 0 }];
			await expect(
				onUploadCreate(
					{} as never,
					{
						size: 400,
						metadata: {
							gallerySlug: "kasia-i-tomek",
							source: "photographer",
							ownerToken: "owner_123_abc_deadbeef",
						},
					} as never,
				),
			).resolves.toBeDefined();

			// Plik 2 tej samej paczki: przekracza limit (usage 900 + 200 > 1000) - odrzucony niezależnie
			mockUsageResult = [{ totalBytes: 900 }];
			await expect(
				onUploadCreate(
					{} as never,
					{
						size: 200,
						metadata: {
							gallerySlug: "kasia-i-tomek",
							source: "photographer",
							ownerToken: "owner_123_abc_deadbeef",
						},
					} as never,
				),
			).rejects.toMatchObject({ status_code: 413 });

			// Plik 3 tej samej paczki: znów mieści się w limicie - odrzucenie pliku 2 go nie zablokowało
			mockUsageResult = [{ totalBytes: 100 }];
			await expect(
				onUploadCreate(
					{} as never,
					{
						size: 300,
						metadata: {
							gallerySlug: "kasia-i-tomek",
							source: "photographer",
							ownerToken: "owner_123_abc_deadbeef",
						},
					} as never,
				),
			).resolves.toBeDefined();
		});
	});

	it("powinien obsłużyć zdarzenie POST_FINISH i wywołać scheduleMediaProcessing z domyślnymi metadanymi", async () => {
		const server = initTusServer(tempDir);
		vi.clearAllMocks();

		const mockUploadDefault = {
			id: "upl-default",
			size: 2048,
			metadata: {
				gallerySlug: "kasia-i-tomek",
			},
		};

		(
			server as unknown as {
				emit: (
					event: string,
					req: unknown,
					res: unknown,
					upload: unknown,
				) => void;
			}
		).emit(EVENTS.POST_FINISH, {}, {}, mockUploadDefault);

		expect(scheduleMediaProcessing).toHaveBeenCalledWith(
			expect.objectContaining({
				fileType: "image",
				uploaderName: "Gość weselny",
				originalName: "plik",
				mimeType: "image/jpeg",
				source: "guest",
			}),
		);
	});

	it("powinien obsłużyć zdarzenie POST_FINISH dla pliku wideo i wywołać scheduleMediaProcessing", async () => {
		const server = initTusServer(tempDir);
		vi.clearAllMocks();

		const mockUpload = {
			id: "upl-123",
			size: 1024,
			metadata: {
				gallerySlug: "kasia-i-tomek",
				uploaderName: "Kasia",
				originalName: "film.mp4",
				fileType: "video/mp4",
			},
		};

		(
			server as unknown as {
				emit: (
					event: string,
					req: unknown,
					res: unknown,
					upload: unknown,
				) => void;
			}
		).emit(EVENTS.POST_FINISH, {}, {}, mockUpload);
		expect(scheduleMediaProcessing).toHaveBeenCalledWith(
			expect.objectContaining({
				fileType: "video",
			}),
		);
	});

	it("powinien pominąć przetwarzanie w POST_FINISH, gdy brak gallerySlug", async () => {
		const server = initTusServer(tempDir);
		vi.clearAllMocks();

		const mockUpload = {
			id: "upl-999",
			size: 1024,
			metadata: {},
		};

		(
			server as unknown as {
				emit: (
					event: string,
					req: unknown,
					res: unknown,
					upload: unknown,
				) => void;
			}
		).emit(EVENTS.POST_FINISH, {}, {}, mockUpload);
		expect(scheduleMediaProcessing).not.toHaveBeenCalled();
	});

	it("powinien przekazać source: photographer do scheduleMediaProcessing w POST_FINISH", async () => {
		const server = initTusServer(tempDir);
		vi.clearAllMocks();

		const mockUpload = {
			id: "upl-photog",
			size: 4096,
			metadata: {
				gallerySlug: "kasia-i-tomek",
				originalName: "sesja.jpg",
				fileType: "image/jpeg",
				source: "photographer",
				ownerToken: "owner_123_abc_deadbeef",
			},
		};

		(
			server as unknown as {
				emit: (
					event: string,
					req: unknown,
					res: unknown,
					upload: unknown,
				) => void;
			}
		).emit(EVENTS.POST_FINISH, {}, {}, mockUpload);

		expect(scheduleMediaProcessing).toHaveBeenCalledWith(
			expect.objectContaining({ source: "photographer" }),
		);
	});
});
