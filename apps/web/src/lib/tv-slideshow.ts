/**
 * Czyste, testowalne bez DOM funkcje pomocnicze dla widoku trybu TV (`/g/{slug}/tv`).
 */

import { buildGalleryUrl } from "@/lib/gallery-url";

/**
 * Adres galerii gościa kodowany w QR w rogu ekranu w trybie TV
 * (ta sama funkcja co dla karteczki stołowej).
 */
export const buildTvGalleryQrUrl = buildGalleryUrl;
