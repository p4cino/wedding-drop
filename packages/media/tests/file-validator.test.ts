import fs from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { validateMediaFile } from "../src/file-validator";

describe("validateMediaFile (Magic Bytes & Anti-XSS)", () => {
	const testDir = path.join(__dirname, "fixtures-validator");

	beforeAll(async () => {
		await fs.mkdir(testDir, { recursive: true });
	});

	afterAll(async () => {
		try {
			await fs.rm(testDir, { recursive: true, force: true });
		} catch {
			// ignore cleanup error
		}
	});

	async function createTempFile(
		name: string,
		content: Buffer | string,
	): Promise<string> {
		const filePath = path.join(testDir, name);
		await fs.writeFile(filePath, content);
		return filePath;
	}

	it("powinien odrzucić plik zbyt mały (< 12 bajtów)", async () => {
		const filePath = await createTempFile("tiny.bin", Buffer.from([1, 2, 3]));
		const res = await validateMediaFile(filePath, "tiny.jpg", "image");
		expect(res.valid).toBe(false);
		expect(res.error).toContain("zbyt mały");
	});

	it("powinien odrzucić plik HTML podszywający się pod JPEG (Stored XSS)", async () => {
		const htmlContent =
			"<!DOCTYPE html><html><body><script>alert(1)</script></body></html>";
		const filePath = await createTempFile("fake.jpg", htmlContent);
		const res = await validateMediaFile(filePath, "fake.jpg", "image");
		expect(res.valid).toBe(false);
		expect(res.error).toContain(
			"Wykryto niedozwoloną zawartość tekstową/skryptową",
		);
	});

	it("powinien odrzucić skrypt PHP z rozszerzeniem .jpg", async () => {
		const phpContent = "<?php echo 'malicious'; ?>";
		const filePath = await createTempFile("shell.jpg", phpContent);
		const res = await validateMediaFile(filePath, "shell.jpg", "image");
		expect(res.valid).toBe(false);
		expect(res.error).toContain(
			"Wykryto niedozwoloną zawartość tekstową/skryptową",
		);
	});

	it("powinien odrzucić wektor SVG (potencjalny XSS) przesyłany jako zdjęcie", async () => {
		const svgContent =
			'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
		const filePath = await createTempFile("image.svg", svgContent);
		const res = await validateMediaFile(filePath, "image.svg", "image");
		expect(res.valid).toBe(false);
		expect(res.error).toContain(
			"Wykryto niedozwoloną zawartość tekstową/skryptową",
		);
	});

	it("powinien zaakceptować poprawny nagłówek JPEG i zachować rozszerzenie .jpg", async () => {
		// JPEG magic bytes: FF D8 FF E0 + padding
		const jpegHeader = Buffer.concat([
			Buffer.from([
				0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
			]),
			Buffer.alloc(32, 0),
		]);
		const filePath = await createTempFile("valid.jpg", jpegHeader);
		const res = await validateMediaFile(filePath, "valid.jpg", "image");
		expect(res.valid).toBe(true);
		expect(res.safeExt).toBe(".jpg");
	});

	it("powinien zneutralizować rozszerzenie .html dla prawidłowych danych JPEG do .jpg", async () => {
		const jpegHeader = Buffer.concat([
			Buffer.from([
				0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
			]),
			Buffer.alloc(32, 0),
		]);
		const filePath = await createTempFile("bypass.html", jpegHeader);
		const res = await validateMediaFile(filePath, "bypass.html", "image");
		expect(res.valid).toBe(true);
		// Rozszerzenie MUSI zostać znormalizowane do bezpiecznego formatu graficznego (.jpg)
		expect(res.safeExt).toBe(".jpg");
	});

	it("powinien zaakceptować poprawny nagłówek PNG", async () => {
		const pngHeader = Buffer.concat([
			Buffer.from([
				0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
			]),
			Buffer.alloc(32, 0),
		]);
		const filePath = await createTempFile("valid.png", pngHeader);
		const res = await validateMediaFile(filePath, "valid.png", "image");
		expect(res.valid).toBe(true);
		expect(res.safeExt).toBe(".png");
	});

	it("powinien zaakceptować poprawny nagłówek MP4 z ftyp", async () => {
		// MP4: 00 00 00 18 'ftyp' 'mp42' ...
		const mp4Header = Buffer.concat([
			Buffer.from([0x00, 0x00, 0x00, 0x18]),
			Buffer.from("ftypmp42", "ascii"),
			Buffer.alloc(32, 0),
		]);
		const filePath = await createTempFile("video.mp4", mp4Header);
		const res = await validateMediaFile(filePath, "video.mp4", "video");
		expect(res.valid).toBe(true);
		expect(res.safeExt).toBe(".mp4");
	});

	it("powinien odrzucić plik graficzny przekazany jako plik wideo", async () => {
		const jpegHeader = Buffer.concat([
			Buffer.from([
				0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
			]),
			Buffer.alloc(32, 0),
		]);
		const filePath = await createTempFile("not-video.mp4", jpegHeader);
		const res = await validateMediaFile(filePath, "not-video.mp4", "video");
		expect(res.valid).toBe(false);
		expect(res.error).toContain(
			"Sygnatura pliku nie odpowiada obsługiwanemu formatowi wideo",
		);
	});
});
