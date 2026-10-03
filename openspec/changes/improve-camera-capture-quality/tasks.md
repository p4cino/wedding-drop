# Tasks

## 1. Silnik pomocniczy (`photobooth.ts`)
- [x] 1.1 Podnieść `MAX_CAPTURE_DIMENSION` z 1920 do 2560px oraz dodać uogólnioną funkcję `captureSourceToCanvas` obsługującą dowolne `CanvasImageSource` z zachowaniem dekoracyjnej ramki motywu wesela.
- [x] 1.2 Dodać testy jednostkowe w `apps/web/tests/unit/lib/photobooth.test.ts` weryfikujące skalowanie i rysowanie z nowego helpera.

## 2. Komponent aparatu (`CameraCapture.tsx`)
- [x] 2.1 Zaktualizować zapytanie `getUserMedia` o docelową rozdzielczość Full HD (`width: { ideal: 1920 }`, `height: { ideal: 1080 }`).
- [x] 2.2 Dodać automatyczną aktywację ciągłego autofokusu (`focusMode: "continuous"`) na aktywnej ścieżce wideo, jeśli wspiera ją `track.getCapabilities()`.
- [x] 2.3 Wdrożyć hybrydowy mechanizm zwalniania migawki: próba wykonania zdjęcia przez `ImageCapture.takePhoto()` (z konwersją do `ImageBitmap`), a w razie braku wsparcia lub błędu płynny fallback do `captureFrameToCanvas(video)`.
- [x] 2.4 Zwiększyć parametr kompresji JPEG w `canvasToJpegFile` do 0.95.

## 3. Testy i Walidacja
- [x] 3.1 Zaktualizować testy jednostkowe w `apps/web/tests/unit/components/CameraCapture.test.tsx` pod kątem nowych ograniczeń Full HD oraz zachowania z i bez `ImageCapture`.
- [x] 3.2 Uruchomić testy jednostkowe: `pnpm --filter @wedding-drop/web test`.
- [x] 3.3 Uruchomić weryfikację typów i linter: `pnpm check-types` oraz `pnpm biome check`.

## 4. Dokumentacja
- [x] 4.1 Uzupełnić `DOCUMENTATION.md` o opis mechanizmu podnoszenia rozdzielczości (Full HD, `ImageCapture` i ciągły autofokus).
