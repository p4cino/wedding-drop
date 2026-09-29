/**
 * Buduje adres URL galerii gościa (`/g/{slug}`) kodowany w QR — na karteczce stołowej
 * i w trybie TV.
 *
 * @param slug - slug galerii weselnej
 * @param origin - opcjonalne origin (protokół + host); gdy pominięte, używa
 *   `window.location.origin` w przeglądarce, w przeciwnym razie zwraca ścieżkę względną.
 */
export function buildGalleryUrl(slug: string, origin?: string): string {
	const resolvedOrigin =
		origin ?? (typeof window !== "undefined" ? window.location.origin : "");
	return `${resolvedOrigin}/g/${slug}`;
}
