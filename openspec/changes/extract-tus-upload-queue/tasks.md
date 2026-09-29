# Tasks

## 1. Wspólna funkcja uploadu

- [x] 1.1 Dodaj `apps/web/src/lib/tus-upload.ts` z `uploadFileViaTus` (stałe `endpoint`, `chunkSize`, `retryDelays`, throttling postępu) i testy jednostkowe (sukces, błąd, throttling, metadane przekazane bez zmian)
- [x] 1.2 Dodaj `apps/web/tests/helpers/tus-mock.ts` i przepisz na niego `vi.mock("tus-js-client")` w `UploaderDrawer.test.tsx` oraz `PhotographerImportPanel.test.tsx`; zweryfikuj, że oba pliki testów przechodzą

## 2. Hook kolejki

- [x] 2.1 Dodaj `apps/web/src/hooks/useUploadQueue.ts` (`phase`, `addFiles`, `remove`, `clear`, `start`) i testy: sukces, całkowita porażka, sukces częściowy, pominięcie już zakończonych
- [x] 2.2 Zweryfikuj, że callback sukcesu jest wołany tylko przy ≥ 1 udanym pliku

## 3. Komponenty i migracja

- [x] 3.1 Dodaj `UploadFileRow` i `FilePickerDropzone` (teksty jako propsy) z testami renderowania
- [x] 3.2 Przepisz `PhotographerImportPanel.tsx` na hook + komponenty; zweryfikuj metadane `source`/`ownerToken` istniejącym testem
- [x] 3.3 Przepisz `UploaderDrawer.tsx`: hook + komponenty, jeden mechanizm resetu, usuń `uploadInstance`, wyświetl błąd elementu; zweryfikuj `UploaderDrawer.test.tsx`

## 4. Dokumentacja i weryfikacja

- [x] 4.1 Zaktualizuj README.md/DOCUMENTATION.md (opis wspólnego klienta uploadu; liczniki testów) zgodnie z AGENTS.md §7
- [ ] 4.2 Uruchom `pnpm lint`, `check-types`, `pnpm test:coverage` + `node scripts/check-coverage.js` i e2e `guest-journey`/`owner-moderation`
