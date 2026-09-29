/** Rozmiar w megabajtach (1 MB = 1024 * 1024 B) z jedną cyfrą po przecinku, np. `1.5`. */
export function formatMegabytes(bytes: number): string {
	return (bytes / (1024 * 1024)).toFixed(1);
}
