# Tasks

## 1. Pomocnicze moduły

- [x] 1.1 Dodaj `apps/web/src/lib/gallery-url.ts` (`buildGalleryUrl`) i `lib/card-defaults.ts` (`DEFAULT_CARD_COLORS`); przełącz `buildTvGalleryQrUrl` i `api/gallery/[slug]/route.ts`; zweryfikuj istniejący `tv-slideshow.test.ts` i testy trasy galerii
- [x] 1.2 Dodaj testy jednostkowe `buildGalleryUrl` (origin, slug, brak zdublowanych slashy)

## 2. Poprawki edytora

- [x] 2.1 Wprowadź status pobrania (`loading|ready|notFound|error`) i ekran `GalleryStatusScreen`/komunikat błędu; zweryfikuj testem (404 → brak podglądu i brak przycisków PDF)
- [x] 2.2 Popraw efekt QR (flaga anulowania, `.catch`, brak fallbacku `localhost`) i zweryfikuj testem z odwróconą kolejnością rozwiązania obietnic
- [x] 2.3 Wynieś `PRESET_PALETTES` na poziom modułu, użyj `URLSearchParams` dla PDF, stabilne klucze linii instrukcji
- [x] 2.4 Wydziel `CardPreview` i zweryfikuj `pnpm --filter @wedding-drop/web check-types`

## 3. Weryfikacja

- [ ] 3.1 E2E `card-customizer` na trzech profilach Playwright, `pnpm lint`, `pnpm test:coverage` + `node scripts/check-coverage.js`
