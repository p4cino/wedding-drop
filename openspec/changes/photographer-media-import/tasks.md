# Tasks

## 1. Schemat bazy danych i walidatory

- [x] 1.1 Dodaj kolumnę `source` (text, domyślnie `"guest"`) do `mediaItems` w `packages/db/src/schema.ts` i wygeneruj migrację przez `pnpm --filter @wedding-drop/db db:generate`, weryfikując, że plik migracji powstał
- [x] 1.2 Zastosuj migrację (`pnpm db:push`) i zweryfikuj `pnpm --filter @wedding-drop/db test` (istniejące testy schematu przechodzą, plus nowy test sprawdzający domyślną wartość `source`)
- [x] 1.3 Rozszerz `tusUploadMetadataDto` w `packages/db/src/validators.ts` o opcjonalne `source` (`"guest" | "photographer"`, domyślnie `"guest"`) i `ownerToken` i zweryfikuj testem jednostkowym parsowania obu wariantów metadanych

## 2. Autoryzacja i limit pojemności w warstwie TUS

- [x] 2.1 Zaimplementuj wstrzykiwaną funkcję weryfikującą (sygnatura opisana w design.md) w `apps/web/server.ts`, przekazywaną do `initTusServer`, reużywającą istniejący `verifyOwnerToken` z `@/lib/auth`, i zweryfikuj testem jednostkowym dla poprawnego i niepoprawnego tokenu
- [x] 2.2 Zmień sygnaturę `initTusServer` w `packages/media/src/tus-server.ts`, by przyjmowała opcjonalny parametr weryfikujący, z domyślnym zachowaniem "zawsze odrzuć `source: photographer` bez wstrzykniętej funkcji", i zweryfikuj, że istniejące testy `packages/media` nadal przechodzą bez zmian w wywołaniach bez tego parametru
- [x] 2.3 W `onUploadCreate` odrzuć upload ze `source: "photographer"` bez poprawnej weryfikacji (status 401) i zweryfikuj testem integracyjnym happy-path oraz odrzucenia
- [x] 2.4 Dodaj sprawdzenie sumy `fileSize` istniejących materiałów galerii względem `maxStorageBytes` wyłącznie dla `source: "photographer"` i zweryfikuj testem integracyjnym: import mieszczący się w limicie przechodzi, przekraczający jest odrzucony, `maxStorageBytes: 0` (bez limitu) zawsze przechodzi

## 3. Przetwarzanie i oznaczenie źródła

- [x] 3.1 Przekaż `source` przez `ProcessTask`/`processMediaTask` w `packages/media/src/media-processor.ts` do zapisu w `media_items` i zweryfikuj testem jednostkowym, że wpis w bazie ma poprawną wartość `source` dla obu wariantów
- [x] 3.2 Zweryfikuj testem integracyjnym, że materiał ze `source: "photographer"` przechodzi przez identyczną kolejkę `p-queue(2)` i watchdog FFmpeg (25s) bez wyjątków w logice przetwarzania

## 4. UI panelu właściciela

- [x] 4.1 Zaimplementuj uproszczony wariant uploadera (np. `apps/web/src/components/owner/PhotographerImportPanel.tsx`) z masowym wyborem plików, paskiem postępu paczki i metadanymi `source: "photographer"` + `ownerToken`, reużywając konfigurację `tus.Upload` z `UploaderDrawer.tsx`, i zweryfikuj manualnie upload kilku plików w panelu właściciela
- [x] 4.2 Osadź `PhotographerImportPanel` w `apps/web/src/app/[locale]/owner/[slug]/page.tsx` i zweryfikuj manualnie, że sekcja jest dostępna wyłącznie po zalogowaniu właściciela
- [x] 4.3 Dodaj w `MediaGrid.tsx`/`MediaGridWithModeration.tsx` odróżniającą odznakę dla `source: "photographer"` i zweryfikuj testem jednostkowym renderowania (React Testing Library) obecności odznaki tylko dla tego źródła

## 5. Tłumaczenia, testy end-to-end i dokumentacja

- [x] 5.1 Dodaj nowe klucze tłumaczeń (PL/EN/DE) dla panelu importu i odznaki źródła w `apps/web/messages/*.json` i zweryfikuj `pnpm --filter @wedding-drop/web check-types` oraz manualny podgląd w każdym języku
- [x] 5.2 Dodaj scenariusz Playwright w `apps/web/e2e/owner-moderation.spec.ts` potwierdzający: import bez tokenu jest odrzucony, import z tokenem się powodzi i pojawia się w galerii z odznaką źródła, i zweryfikuj przejście testu
- [x] 5.3 Zaktualizuj `README.md` (sekcja "Dla Pary Młodej") i `DOCUMENTATION.md` (schemat bazy, opis potoku uploadu, endpoint TUS) zgodnie z AGENTS.md §7 i zweryfikuj, że opis odzwierciedla faktyczne zachowanie, w tym jawną wzmiankę o dzieleniu tej samej kolejki `p-queue(2)` z uploadami gości
