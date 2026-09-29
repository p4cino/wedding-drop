# Tasks

## 1. Hooki

- [x] 1.1 Dodaj `apps/web/src/hooks/useEscapeKey.ts`, `useFocusTrap.ts`, `useSwipe.ts` z testami (pętla Tab w obie strony, przywrócenie fokusu, Escape wyłączany warunkiem, próg swipe)
- [x] 1.2 Przełącz `LightboxModal` na hooki i wydziel `NavButton`; zweryfikuj, że `LightboxModal.test.tsx` przechodzi bez zmian asercji

## 2. Pozostałe modale

- [x] 2.1 Użyj hooków w `UploaderDrawer` (Escape zablokowany podczas wysyłania) i dodaj test focus trap/przywrócenia fokusu
- [x] 2.2 Użyj hooków w `GDriveExportModal` (Escape zablokowany podczas eksportu); zaktualizuj `GDriveExportModal.test.tsx`
- [x] 2.3 Użyj hooków w modalu tworzenia galerii w panelu admina (po lub przed `split-admin-page`)

## 3. Kamera

- [x] 3.1 Dodaj `isCameraSupported()` do `lib/photobooth.ts` (z testem) i użyj w `CameraCapture` oraz `UploaderDrawer`
- [x] 3.2 Dodaj `stopStream()` przy przejściu w `error` w `CameraCapture` i test, że po błędzie migawki wszystkie ścieżki strumienia mają `stop()` wywołane
- [x] 3.3 Przenieś obsługę `video.play` do `tests/setup.ts`, w kodzie produkcyjnym użyj `await video.play()` w `try/catch`; dodaj `tests/helpers/media-devices.ts` i podmień 4 powtórzenia w `UploaderDrawer.test.tsx` oraz `CameraCapture.test.tsx`

## 4. Weryfikacja

- [ ] 4.1 `pnpm lint`, `check-types`, `pnpm test:coverage` + `node scripts/check-coverage.js`, e2e `guest-journey` (photobooth) na trzech profilach
