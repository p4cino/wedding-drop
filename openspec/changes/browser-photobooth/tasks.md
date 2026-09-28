# Tasks

## 1. Odczyt kolorów motywu galerii

- [x] 1.1 Dodaj do publicznego `GET /api/gallery/[slug]` (lub nowego, lekkiego publicznego pola) zwracanie `primaryColor`/`accentColor` z `card_settings` (z domyślnymi wartościami, gdy brak rekordu) i zweryfikuj testem jednostkowym odpowiedzi API dla galerii z i bez zapisanych ustawień
- [x] 1.2 Zaktualizuj typ `GalleryData` w `apps/web/src/app/[locale]/g/[slug]/page.tsx` (i miejscach reużywających) o nowe pola i zweryfikuj `pnpm --filter @wedding-drop/web check-types`

## 2. Komponent `CameraCapture`

- [x] 2.1 Zaimplementuj `apps/web/src/components/CameraCapture.tsx`: żądanie `getUserMedia`, podgląd `<video>` na żywo, przycisk migawki i zweryfikuj manualnie w przeglądarce z dostępną kamerą
- [x] 2.2 Obsłuż odmowę dostępu/brak kamery komunikatem błędu bez blokowania reszty drawera i zweryfikuj manualnie po zablokowaniu uprawnień kamery w przeglądarce
- [x] 2.3 Zaimplementuj zrzut klatki na `<canvas>` z zachowaniem faktycznych wymiarów strumienia wideo i zweryfikuj testem jednostkowym funkcji kompozycji (podanie zamockowanych wymiarów, sprawdzenie wymiarów wyjściowego canvasu)
- [x] 2.4 Dorysuj na canvasie dekoracyjną ramkę używającą `primaryColor`/`accentColor` przekazanych jako propsy, z fallbackiem na domyślne kolory generatora winietek, i zweryfikuj testem jednostkowym renderowania z i bez podanych kolorów
- [x] 2.5 Wyeksportuj canvas jako `Blob`/`File` (`image/jpeg`, jakość 0.92, maks. 1920px po dłuższym boku) i zweryfikuj testem jednostkowym rozmiaru/typu wynikowego pliku

## 3. Integracja z drawerem uploadu

- [x] 3.1 Dodaj w `UploaderDrawer.tsx` przełącznik/przycisk "Zrób zdjęcie" otwierający `CameraCapture` obok istniejącego wyboru plików i zweryfikuj manualnie przełączanie między trybami
- [x] 3.2 Podłącz wynikowy `File` ze zdjęcia z aparatu do tej samej listy `files`/`startUpload` co pliki wybrane ręcznie (te same metadane `gallerySlug`, `uploaderName`, `originalName`, `fileType`) i zweryfikuj testem jednostkowym, że oba źródła plików trafiają do wspólnej kolejki wysyłki
- [x] 3.3 Rozszerz istniejący test `apps/web/tests/unit/components/UploaderDrawer.test.tsx` o scenariusz dodania pliku z `CameraCapture` i zweryfikuj przejście testu

## 4. Testy end-to-end i dokumentacja

- [x] 4.1 Dodaj scenariusz Playwright w `apps/web/e2e/guest-journey.spec.ts` (z zamockowanym `getUserMedia` przez `page.addInitScript`/fake media stream) potwierdzający, że zdjęcie z photobooth pojawia się w galerii tak samo jak zwykły upload, i zweryfikuj przejście testu we wszystkich profilach (Desktop Chromium, Mobile Chrome, Mobile Safari)
- [x] 4.2 Dodaj nowe klucze tłumaczeń (PL/EN/DE) dla UI photobooth w `apps/web/messages/*.json` i zweryfikuj manualny podgląd w każdym języku
- [x] 4.3 Zaktualizuj `README.md` (sekcja "Główne Funkcje" — dla Gości) i `DOCUMENTATION.md` o nową funkcję zgodnie z polityką dokumentacji z AGENTS.md §7 i zweryfikuj, że opis odzwierciedla faktyczne zachowanie
