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

	it("onUploadCreate powinien odrzucić upload (404), gdy galeria nie istnieje", async () => {
		mockGalleryResult = [];
		const server = initTusServer(tempDir);
		const onUploadCreate = server.options.onUploadCreate;

		if (onUploadCreate) {
			await expect(
				onUploadCreate(
					{} as never,
					{ metadata: { gallerySlug: "nieistniejaca" } } as never,
				),
			).rejects.toMatchObject({
				status_code: 404,
				body: "Błąd: Galeria nie istnieje.",
			});
		}
	});

	it("onUploadCreate powinien odrzucić upload (403), gdy galeria jest wyłączona (isActive: false)", async () => {
		mockGalleryResult = [{ id: "gal-1", maxStorageBytes: 0, isActive: false }];
		const server = initTusServer(tempDir);
		const onUploadCreate = server.options.onUploadCreate;

		if (onUploadCreate) {
			await expect(
				onUploadCreate(
					{} as never,
					{ metadata: { gallerySlug: "kasia-i-tomek" } } as never,
				),
			).rejects.toMatchObject({
				status_code: 403,
				body: expect.stringContaining("wyłączona"),
			});
		}
	});

	it("onUploadCreate powinien odrzucić upload wideo (403), gdy galeria nie zezwala na filmy (allowVideos: false)", async () => {
		mockGalleryResult = [
			{ id: "gal-1", maxStorageBytes: 0, isActive: true, allowVideos: false },
		];
		const server = initTusServer(tempDir);
		const onUploadCreate = server.options.onUploadCreate;

		if (onUploadCreate) {
			await expect(
				onUploadCreate(
					{} as never,
					{
						metadata: {
							gallerySlug: "kasia-i-tomek",
							fileType: "video/mp4",
							originalName: "film.mp4",
						},
					} as never,
				),
			).rejects.toMatchObject({
				status_code: 403,
				body: expect.stringContaining(
					"Wgrywanie filmów i nagrań jest wyłączone",
				),
			});
		}
	});

	describe("onUploadCreate - blokada gości (allowGuestUploads)", () => {
		it("powinien odrzucić upload gościa (403), gdy allowGuestUploads jest fałszywe", async () => {
			mockGalleryResult = [
				{ id: "gal-1", allowGuestUploads: false, maxStorageBytes: 0 },
			];
			const server = initTusServer(tempDir);
			const onUploadCreate = server.options.onUploadCreate;

			if (onUploadCreate) {
				await expect(
					onUploadCreate(
						{} as never,
						{
							size: 1000,
							metadata: {
								gallerySlug: "kasia-i-tomek",
							},
						} as never,
					),
				).rejects.toMatchObject({
					status_code: 403,
					body: expect.stringContaining(
						"Przesyłanie plików przez gości jest wyłączone",
					),
				});
			}
		});

		it("powinien zaakceptować upload fotografa, nawet gdy allowGuestUploads jest fałszywe", async () => {
			mockGalleryResult = [
				{ id: "gal-1", allowGuestUploads: false, maxStorageBytes: 0 },
			];
			const verifyOwnerCredentials = vi.fn().mockReturnValue(true);
			const server = initTusServer(tempDir, { verifyOwnerCredentials });
			const onUploadCreate = server.options.onUploadCreate;

			if (onUploadCreate) {
				const res = await onUploadCreate(
					{} as never,
					{
						size: 1000,
						metadata: {
							gallerySlug: "kasia-i-tomek",
							source: "photographer",
							ownerToken: "valid-token",
						},
					} as never,
				);
				expect(res).toEqual({
					metadata: {
						gallerySlug: "kasia-i-tomek",
						source: "photographer",
						ownerToken: "valid-token",
					},
				});
			}
		});
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

	it("onUploadCreate powinien odrzucić nagranie audio (403), gdy galeria nie zezwala na filmy", async () => {
		mockGalleryResult = [
			{ id: "gal-1", maxStorageBytes: 0, isActive: true, allowVideos: false },
		];
		const onUploadCreate = initTusServer(tempDir).options.onUploadCreate;

		await expect(
			onUploadCreate?.(
				{} as never,
				{
					metadata: {
						gallerySlug: "kasia-i-tomek",
						fileType: "audio/webm",
						originalName: "zyczenia.webm",
					},
				} as never,
			),
		).rejects.toMatchObject({ status_code: 403 });
	});

	it.each([
		["video/webm", "zyczenia_1.webm", "video", "video"],
		["audio/webm", "zyczenia_2.webm", "audio", "audio"],
		["audio/mp4", "zyczenia_3.mp4", "audio", "audio"],
		["image/jpeg", "foto.jpg", "image", "photo"],
	])(
		"POST_FINISH klasyfikuje %s (%s) jako fileType=%s, mediaType=%s",
		(mime, name, fileType, mediaType) => {
			const server = initTusServer(tempDir);
			vi.clearAllMocks();

			(
				server as unknown as {
					emit: (e: string, req: unknown, res: unknown, up: unknown) => void;
				}
			).emit(
				EVENTS.POST_FINISH,
				{},
				{},
				{
					id: "upl-kind",
					size: 10,
					metadata: {
						gallerySlug: "kasia-i-tomek",
						originalName: name,
						fileType: mime,
					},
				},
			);

			expect(scheduleMediaProcessing).toHaveBeenCalledWith(
				expect.objectContaining({ fileType, mediaType }),
			);
		},
	);

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

describe("tus-server - limity i kontrola dostępu (owasp-hardening)", () => {
	const tempDir = path.join(os.tmpdir(), "wedding-drop-test-tus-hardening");
	const meta = { gallerySlug: "kasia-i-tomek" };
	const reqWith = (headers: Record<string, string>) =>
		({ headers: new Headers(headers) }) as never;

	beforeEach(() => {
		vi.clearAllMocks();
		mockGalleryResult = [{ id: "gal-1", maxStorageBytes: 0 }];
		mockUsageResult = [{ totalBytes: 0 }];
	});

	it("ustawia maxSize na 1 GiB", () => {
		const server = initTusServer(tempDir);
		expect(server.options.maxSize).toBe(1024 * 1024 * 1024);
	});

	it("odrzuca upload z odroczonym rozmiarem (400)", async () => {
		const server = initTusServer(tempDir);
		await expect(
			server.options.onUploadCreate?.(
				{} as never,
				{ sizeIsDeferred: true, metadata: meta } as never,
			),
		).rejects.toMatchObject({ status_code: 400 });
	});

	it("galeria z hasłem: gość bez sesji dostaje 401, z sesją przechodzi", async () => {
		mockGalleryResult = [
			{ id: "gal-1", guestPassword: "hash", maxStorageBytes: 0 },
		];
		const verifyGuestAccess = vi.fn(
			(_slug: string, cookie?: string) =>
				cookie === "wd_guest_kasia-i-tomek=ok",
		);
		const server = initTusServer(tempDir, { verifyGuestAccess });
		const upload = { size: 10, metadata: meta } as never;

		await expect(
			server.options.onUploadCreate?.(reqWith({}), upload),
		).rejects.toMatchObject({ status_code: 401 });
		await expect(
			server.options.onUploadCreate?.(
				reqWith({ cookie: "wd_guest_kasia-i-tomek=ok" }),
				upload,
			),
		).resolves.toBeDefined();
	});

	it("galeria z hasłem bez wstrzykniętej weryfikacji odrzuca gościa (401)", async () => {
		mockGalleryResult = [
			{ id: "gal-1", guestPassword: "hash", maxStorageBytes: 0 },
		];
		const server = initTusServer(tempDir);
		await expect(
			server.options.onUploadCreate?.(
				reqWith({ cookie: "wd_guest_kasia-i-tomek=ok" }),
				{ size: 10, metadata: meta } as never,
			),
		).rejects.toMatchObject({ status_code: 401 });
	});

	it("zwraca 429 z Retry-After, gdy limiter blokuje gościa", async () => {
		const checkUploadRateLimit = vi.fn().mockReturnValue(30);
		const server = initTusServer(tempDir, { checkUploadRateLimit });
		await expect(
			server.options.onUploadCreate?.(
				reqWith({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }),
				{ size: 10, metadata: meta } as never,
			),
		).rejects.toMatchObject({
			status_code: 429,
			headers: { "Retry-After": "30" },
		});
		expect(checkUploadRateLimit).toHaveBeenCalledWith(
			"203.0.113.5",
			"kasia-i-tomek",
		);
	});

	it("limiter nie dotyczy importu fotografa", async () => {
		const checkUploadRateLimit = vi.fn().mockReturnValue(30);
		const server = initTusServer(tempDir, {
			checkUploadRateLimit,
			verifyOwnerCredentials: () => true,
		});
		await expect(
			server.options.onUploadCreate?.(reqWith({}), {
				size: 10,
				metadata: { ...meta, source: "photographer", ownerToken: "t" },
			} as never),
		).resolves.toBeDefined();
		expect(checkUploadRateLimit).not.toHaveBeenCalled();
	});

	it("limit pojemności galerii obowiązuje także gości (413)", async () => {
		mockGalleryResult = [{ id: "gal-1", maxStorageBytes: 1000 }];
		mockUsageResult = [{ totalBytes: 900 }];
		const server = initTusServer(tempDir);
		await expect(
			server.options.onUploadCreate?.(reqWith({}), {
				size: 200,
				metadata: meta,
			} as never),
		).rejects.toMatchObject({ status_code: 413 });
		await expect(
			server.options.onUploadCreate?.(reqWith({}), {
				size: 100,
				metadata: meta,
			} as never),
		).resolves.toBeDefined();
	});
});

describe("cleanupOrphanedUploads", () => {
	it("usuwa pliki starsze niż 24 h, zostawia świeże", async () => {
		const fsp = await import("node:fs/promises");
		const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "tus-cleanup-"));
		const oldFile = path.join(dir, "upload_old");
		const freshFile = path.join(dir, "upload_fresh");
		await fsp.writeFile(oldFile, "x");
		await fsp.writeFile(freshFile, "x");
		const past = new Date(Date.now() - 25 * 60 * 60 * 1000);
		await fsp.utimes(oldFile, past, past);

		const { cleanupOrphanedUploads } = await import("../src/tus-server.js");
		expect(await cleanupOrphanedUploads(dir)).toBe(1);
		await expect(fsp.stat(oldFile)).rejects.toThrow();
		expect((await fsp.stat(freshFile)).isFile()).toBe(true);
		await fsp.rm(dir, { recursive: true, force: true });
	});

	it("zwraca 0 dla nieistniejącego katalogu", async () => {
		const { cleanupOrphanedUploads } = await import("../src/tus-server.js");
		expect(await cleanupOrphanedUploads("/nonexistent/tus-dir")).toBe(0);
	});
});
