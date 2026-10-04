import { describe, expect, it } from "vitest";
import { detectImageType } from "@/lib/image-type";

const bytes = (...b: number[]) => new Uint8Array(b);

describe("detectImageType", () => {
	it("rozpoznaje JPEG, PNG i WebP", () => {
		expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))?.ext).toBe("jpg");
		expect(
			detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))
				?.ext,
		).toBe("png");
		expect(
			detectImageType(
				bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50),
			)?.ext,
		).toBe("webp");
	});

	it("odrzuca SVG, HTML i puste dane", () => {
		const enc = new TextEncoder();
		expect(detectImageType(enc.encode("<svg xmlns='x'></svg>"))).toBeNull();
		expect(detectImageType(enc.encode("<html></html>"))).toBeNull();
		expect(detectImageType(new Uint8Array())).toBeNull();
	});

	it("odrzuca RIFF, który nie jest WebP", () => {
		expect(
			detectImageType(
				bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45),
			),
		).toBeNull();
	});
});
