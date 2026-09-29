# Tasks

## 1. Warstwa API i stan

- [x] 1.1 Dodaj `apps/web/src/hooks/useAdminApi.ts` (nagłówek `x-admin-token`, obsługa `!ok`, 401 → `onUnauthorized`) i testy jednostkowe
- [x] 1.2 Dodaj reducer formularza tworzenia galerii z akcjami `field`/`reset` (w `CreateGalleryModal`; pokryty testami strony admina)

## 2. Komponenty

- [x] 2.1 Wydziel `AdminLoginForm` i `AdminStats` z `page.tsx`; zweryfikuj `check-types`
- [x] 2.2 Wydziel `GalleryTable`/`GalleryRow` z konfiguracją linków (`GALLERY_LINKS`) i `NewTabLinkLabel`; zweryfikuj testem renderowania
- [x] 2.3 Wydziel `CreateGalleryModal` (formularz z reducerem, widok sukcesu, błąd inline, zachowanie danych po błędzie)

## 3. Obsługa błędów

- [x] 3.1 Zamień `alert()` na komunikaty inline (klucze i18n PL/EN/DE) i dodaj obsługę wygasłej sesji (401) oraz błędu usuwania; zweryfikuj testami komponentów

## 4. Weryfikacja

- [ ] 4.1 Zweryfikuj e2e `admin-management` na trzech profilach Playwright, `pnpm lint`, `check-types`, `pnpm test:coverage` + `node scripts/check-coverage.js`
- [ ] 4.2 Zaktualizuj DOCUMENTATION.md (struktura klienta panelu administratora)
