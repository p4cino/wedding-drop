import os from "node:os";
import path from "node:path";
import { EVENTS } from "@tus/server";
import { describe, expect, it, vi } from "vitest";
import { scheduleMediaProcessing } from "../src/media-processor.js";
import { initTusServer } from "../src/tus-server.js";

vi.mock("../src/media-processor.js", () => ({
	scheduleMediaProcessing: vi.fn(),
}));

describe("tus-server configuration", () => {
	const tempDir = path.join(os.tmpdir(), "wedding-drop-test-tus");

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
});
