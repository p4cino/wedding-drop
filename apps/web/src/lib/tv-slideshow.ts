/**
 * Czyste, testowalne bez DOM funkcje pomocnicze dla widoku trybu TV (`/g/{slug}/tv`).
 */

/**
 * Buduje docelowy adres URL galerii gościa, do którego prowadzi kod QR
 * wyświetlany w rogu ekranu w trybie TV.
 *
 * @param slug - slug galerii weselnej
 * @param origin - opcjonalne origin (protokół + host); gdy pominięte, używa
 *   `window.location.origin` w przeglądarce, w przeciwnym razie zwraca ścieżkę względną.
 */
export function buildTvGalleryQrUrl(slug: string, origin?: string): string {
	const resolvedOrigin =
		origin ?? (typeof window !== "undefined" ? window.location.origin : "");
	return `${resolvedOrigin}/g/${slug}`;
}
