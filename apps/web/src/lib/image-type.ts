export type DetectedImage = { ext: "jpg" | "png" | "webp"; mime: string };

/**
 * Rozpoznaje JPEG/PNG/WebP po magic bytes. Zwraca null dla wszystkiego innego
 * (w tym SVG/HTML), niezależnie od deklarowanego typu MIME czy nazwy pliku.
 */
export function detectImageType(buf: Uint8Array): DetectedImage | null {
	if (
		buf.length >= 3 &&
		buf[0] === 0xff &&
		buf[1] === 0xd8 &&
		buf[2] === 0xff
	) {
		return { ext: "jpg", mime: "image/jpeg" };
	}
	if (
		buf.length >= 8 &&
		buf[0] === 0x89 &&
		buf[1] === 0x50 &&
		buf[2] === 0x4e &&
		buf[3] === 0x47 &&
		buf[4] === 0x0d &&
		buf[5] === 0x0a &&
		buf[6] === 0x1a &&
		buf[7] === 0x0a
	) {
		return { ext: "png", mime: "image/png" };
	}
	if (
		buf.length >= 12 &&
		buf[0] === 0x52 && // R
		buf[1] === 0x49 && // I
		buf[2] === 0x46 && // F
		buf[3] === 0x46 && // F
		buf[8] === 0x57 && // W
		buf[9] === 0x45 && // E
		buf[10] === 0x42 && // B
		buf[11] === 0x50 // P
	) {
		return { ext: "webp", mime: "image/webp" };
	}
	return null;
}
