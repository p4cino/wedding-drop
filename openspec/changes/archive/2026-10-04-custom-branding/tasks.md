# Tasks

## 1. Zmiany w bazie danych (Drizzle ORM)

- [x] 1.1 Dodaj schemat tabeli `gallery_branding` powiązanej 1:1 z `galleries` w `packages/db/src/schema.ts` (zawierający `galleryId`, `logoPath`, `backgroundPath`). Zweryfikuj, uruchamiając kompilację pakietu DB (`pnpm --filter @wedding-drop/db build`).
- [x] 1.2 Wygeneruj plik migracji Drizzle ORM (`pnpm --filter @wedding-drop/db generate`) i upewnij się, że migracja się stworzyła. Zweryfikuj dodając odpowiedni eksport do `packages/db/src/index.ts`.

## 2. API Backendowe dla Właściciela

- [x] 2.1 Stwórz endpoint `POST /api/owner/[slug]/branding` (obsługa `multipart/form-data`) walidujący typ MIME (obraz) i zapisujący plik z użyciem `path.posix.join` do `/data/galleries/[slug]/branding/`. Zaktualizuj i uruchom testy jednostkowe API, weryfikując, że dostęp mają tylko zaufani właściciele (status 200) i działa ograniczenie Path Traversal.
- [x] 2.2 Zaimplementuj obsługę metody `DELETE /api/owner/[slug]/branding` do usuwania plików brandingowych oraz czyszczenia rekordów z bazy. Zweryfikuj za pomocą testu `Vitest`, że plik znika z dysku, a odpowiednie pola bazy danych przyjmują wartość `null`.

## 3. Serwowanie plików publicznych

- [x] 3.1 Zaktualizuj niestandardowy serwer w `apps/web/server.ts`, dodając ścieżkę serwującą pliki, np. `/branding-file/:slug/:type`. Zweryfikuj w logach/testach end-to-end integrację z weryfikacją wyjścia poza katalog `/data/galleries/[slug]/branding/` (Path Traversal sandbox).

## 4. UI Panelu Właściciela (Frontend)

- [x] 4.1 Utwórz komponent/zakładkę "Wygląd galerii" w panelu właściciela (`apps/web/src/app/[locale]/owner/[slug]/page.tsx` lub w komponencie zarządzania), pozwalający na wybór plików i wysłanie formularza `POST /api/owner/[slug]/branding`. Zweryfikuj manualnie w lokalnej przeglądarce po uruchomieniu obrazu Docker, że wgranie obrazka powoduje zapis do bazy.
- [x] 4.2 Zaimplementuj w UI widoczność zaktualizowanego brandingu po stronie właściciela oraz podepnij przycisk z akcją `DELETE` resetujący wygląd. Zweryfikuj w lokalnej przeglądarce poprawne odświeżanie stanu w React.

## 5. UI Galerii Gości (Frontend)

- [x] 5.1 Zmodyfikuj stronę główną gości (`apps/web/src/app/[locale]/g/[slug]/page.tsx` oraz jej nawigację), aby pobierała rekord z `gallery_branding`. Zweryfikuj testem end-to-end (Playwright) lub manualnie, że w przypadku istnienia logo, tekst imion pary zostanie zastąpiony tagiem `<img>`.
- [x] 5.2 Zaktualizuj style układu głównego gości z użyciem `Panda CSS`, by ustawiały CSS `background-image` z opcjonalnym nałożeniem filtra, jeśli galeria posiada własne tło w `gallery_branding`. Zweryfikuj efekt wizualnie z nałożoną galerią zdjęć.
- [x] 5.3 Zaktualizuj dokumentację projektu (`DOCUMENTATION.md` / `README.md`) opisującą nową funkcję personalizacji wyglądu (zgodnie z wymogiem `AGENTS.md §7`). Zweryfikuj poleceniem wygenerowania podglądu pliku markdown.
