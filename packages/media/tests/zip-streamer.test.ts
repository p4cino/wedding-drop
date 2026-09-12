import fs from "node:fs";
import { PassThrough } from "node:stream";
import { describe, expect, it, vi } from "vitest";

vi.mock("archiver", async (importOriginal) => {
	const actual = await importOriginal<typeof import("archiver")>();
	return {
		...actual,
		ZipArchive: class extends actual.ZipArchive {
			constructor(options: unknown) {
				super(options as never);
				(
					globalThis as unknown as { __last_archive__: unknown }
				).__last_archive__ = this;
			}
		},
	};
});

import { createGalleryZipStream } from "../src/zip-streamer";

describe("ZipStreamer Service", () => {
	it("powinien utworzyć strumień ZIP dla istniejących plików w galerii", () => {
		const existsSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);

		const items = [
			{ storagePath: "kasia/photo1.jpg", originalFileName: "zdjecie (1).jpg" },
			{
				storagePath: "kasia/photo2.jpg",
				originalFileName: "taniec młodych.jpg",
			},
		];

		const result = createGalleryZipStream(items, "/mock/data");

		expect(result.addedCount).toBe(2);
		expect(result.stream).toBeInstanceOf(PassThrough);

		existsSpy.mockRestore();
	});

	it("powinien pominąć pliki, które fizycznie nie istnieją na dysku", () => {
		const existsSpy = vi.spyOn(fs, "existsSync").mockImplementation((p) => {
			return String(p).includes("photo1.jpg");
		});

		const items = [
			{ storagePath: "kasia/photo1.jpg", originalFileName: "istnieje.jpg" },
			{ storagePath: "kasia/missing.jpg", originalFileName: "brak.jpg" },
		];

		const result = createGalleryZipStream(items, "/mock/data");

		expect(result.addedCount).toBe(1);
		expect(result.stream).toBeInstanceOf(PassThrough);

		existsSpy.mockRestore();
	});

	it("powinien zwrócić addedCount: 0 gdy brak plików do zarchiwizowania", () => {
		const result = createGalleryZipStream([], "/mock/data");

		expect(result.addedCount).toBe(0);
		expect(result.stream).toBeInstanceOf(PassThrough);
	});

	it("powinien obsłużyć błąd obiektu Error w archiwizerze i zniszczyć strumień PassThrough", () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const result = createGalleryZipStream(
			[{ storagePath: "err.jpg", originalFileName: "err.jpg" }],
			"/mock/data",
		);

		result.stream.on("error", () => {});

		const archive = (
			globalThis as unknown as {
				__last_archive__: { emit: (event: string, err: unknown) => void };
			}
		).__last_archive__;
		archive.emit("error", new Error("Błąd I/O ZIP"));
		expect(result.stream.destroyed).toBe(true);

		consoleErrorSpy.mockRestore();
	});

	it("powinien obsłużyć błąd niebędący obiektem Error (string) w archiwizerze", () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const result = createGalleryZipStream(
			[{ storagePath: "err2.jpg", originalFileName: "err2.jpg" }],
			"/mock/data",
		);

		result.stream.on("error", () => {});

		const archive = (
			globalThis as unknown as {
				__last_archive__: { emit: (event: string, err: unknown) => void };
			}
		).__last_archive__;
		archive.emit("error", "Tekstowy błąd ZIP");
		expect(result.stream.destroyed).toBe(true);

		consoleErrorSpy.mockRestore();
	});

	it("powinien przechwycić błąd podczas finalize archiwum", async () => {
		const existsSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const archiverMod = await import("archiver");
		const finalizeSpy = vi
			.spyOn(archiverMod.ZipArchive.prototype, "finalize")
			.mockRejectedValueOnce(new Error("Finalize failed"));

		const _result = createGalleryZipStream(
			[{ storagePath: "fin.jpg", originalFileName: "fin.jpg" }],
			"/mock/data",
		);

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("[ZipStreamer] Błąd finalizacji archiwum"),
			expect.any(Error),
		);

		finalizeSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		existsSpy.mockRestore();
	});
});
