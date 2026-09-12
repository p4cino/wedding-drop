import fs from "node:fs";
import path from "node:path";
import { PassThrough } from "node:stream";
import { ZipArchive } from "archiver";

export interface ZipFileEntry {
	storagePath: string;
	originalFileName: string;
}

export interface ZipStreamResult {
	stream: PassThrough;
	addedCount: number;
}

/**
 * Tworzy bezpośrednio strumieniowane archiwum ZIP bez buforowania całości w pamięci RAM lub na dysku.
 * Spełnia wymóg ochrony procesora i pamięci Intel N100 (poziom kompresji 1).
 */
export function createGalleryZipStream(
	items: ZipFileEntry[],
	dataDir: string,
): ZipStreamResult {
	const passThrough = new PassThrough();
	const archive = new ZipArchive({
		zlib: { level: 1 }, // Poziom 1: szybka kompresja, niskie zużycie RAM/CPU
	});

	archive.on("error", (err: unknown) => {
		console.error("[ZipStreamer] Błąd archiwizera ZIP:", err);
		passThrough.destroy(err instanceof Error ? err : new Error(String(err)));
	});

	archive.pipe(passThrough);

	let addedCount = 0;
	items.forEach((item, idx) => {
		const fullPath = path.join(dataDir, item.storagePath);
		if (fs.existsSync(fullPath)) {
			const safeName = item.originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
			const entryName = `${String(idx + 1).padStart(3, "0")}_${safeName}`;
			archive.file(fullPath, { name: entryName });
			addedCount++;
		}
	});

	if (addedCount > 0) {
		archive.finalize().catch((err: unknown) => {
			console.error("[ZipStreamer] Błąd finalizacji archiwum:", err);
		});
	}

	return {
		stream: passThrough,
		addedCount,
	};
}
