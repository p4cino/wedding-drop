# Proposal

## Why

Cztery okna modalne mają skopiowaną lub brakującą obsługę dostępności:

- Obsługa `Escape` jest napisana osobno w `admin/page.tsx` (ok. l. 54-64), `LightboxModal.tsx` (57-99), `UploaderDrawer.tsx` (84-95) i `owner/GDriveExportModal.tsx` (28-37).
- **Tylko `LightboxModal` ma focus trap i przywracanie fokusu.** `UploaderDrawer` i `GDriveExportModal` deklarują `role="dialog" aria-modal="true"`, ale nie zatrzymują fokusu w oknie ani nie przywracają go po zamknięciu — obietnica modalności nie jest spełniona (użytkownik klawiatury i czytnika ekranu „wychodzi" za okno). Modal w panelu admina ma ten sam problem.
- Obsługa swipe (`touchStartX`/`touchEndX`, ok. l. 101-129 w lightboxie) jest wpleciona w `LightboxModal`, przez co plik jest dłuższy niż potrzeba; dwa przyciski prev/next są niemal identyczne.

Osobno w `CameraCapture.tsx`:

- Gdy zrobienie zdjęcia zawiedzie (`setStatus("error")`), komponent pozostaje zamontowany, a strumień kamery jest zatrzymywany dopiero w cleanupie odmontowania — **dioda kamery świeci** na ekranie błędu.
- `await video.play?.()` z komentarzem o jsdom to kod produkcyjny dopasowany do testu.
- Sprawdzenie wsparcia `getUserMedia` jest zduplikowane w `CameraCapture.tsx:45` i `UploaderDrawer.tsx:57`.

## What Changes

- Hooki `useEscapeKey(isActive, onEscape)`, `useFocusTrap(containerRef, isActive)` (z zapamiętaniem i przywróceniem poprzedniego fokusu), `useSwipe({ onLeft, onRight })` w `apps/web/src/hooks/` — przeniesione z logiki lightboxa.
- Zastosowanie w `LightboxModal`, `UploaderDrawer`, `GDriveExportModal` i modalu tworzenia galerii w adminie (kolejność względem `split-admin-page` dowolna).
- `LightboxModal`: jeden `NavButton` dla prev/next.
- `CameraCapture`: `stopStream()` wywoływane przy przejściu w `error`; `video.play` mockowany w `tests/setup.ts` (jsdom) zamiast `play?.()` w kodzie produkcyjnym.
- `isCameraSupported()` w `lib/photobooth.ts` używane w obu miejscach.
- Helper testowy `tests/helpers/media-devices.ts` (`stubMediaDevices(fn?)`) zamiast czterokrotnego `Object.defineProperty(navigator, "mediaDevices", …)`.

## Capabilities

### New Capabilities

- `modal-accessibility`: okna modalne zatrzymują fokus, zamykają się klawiszem Escape i przywracają fokus po zamknięciu; kamera jest wyłączana po błędzie.

### Modified Capabilities

(brak)

## Impact

- `apps/web/src/hooks/*`, `LightboxModal.tsx`, `UploaderDrawer.tsx`, `GDriveExportModal.tsx`, `admin/page.tsx` (lub `CreateGalleryModal`), `CameraCapture.tsx`, `lib/photobooth.ts`, `tests/setup.ts`, testy.
- Bez zmian API/bazy. Kamera nadal działa wyłącznie lokalnie w przeglądarce (bez wysyłania obrazu poza istniejący upload).
- N100: bez wpływu.

## Non-goals / Poza zakresem

- Brak własnej biblioteki modali (Radix/Headless UI) — zostajemy przy małych hookach.
- Brak zmian wyglądu i animacji.
- Brak przerywania trwających uploadów przy zamknięciu drawera (zob. `extract-tus-upload-queue`).
