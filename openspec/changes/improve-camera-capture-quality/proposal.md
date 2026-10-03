# Proposal

## Why

Zdjęcia robione za pośrednictwem funkcji aparatu w przeglądarce (`CameraCapture.tsx`) cechują się niską ostrością i rozdzielczością (często zaledwie 640×480 lub 1280×720). Wynika to z faktu, że zapytanie `getUserMedia` nie deklarowało preferowanej rozdzielczości, przez co przeglądarki domyślnie uruchamiały niskorozdzielczy strumień wideokonferencyjny, a zdjęcie było jedynie zrzutem klatki wideo ze skompresowanego strumienia. W rezultacie pamiątkowe zdjęcia gości weselnych na dużych ekranach (TV, galeria) wyglądały na rozmyte i ziarniste.

## What Changes

- Wymuszenie wysokiej rozdzielczości sensora w `getUserMedia`: dodanie elastycznych ograniczeń `width: { ideal: 1920 }` oraz `height: { ideal: 1080 }` (z zachowaniem fallbacku dla słabszych kamer).
- Włączenie ciągłego autofokusu (`focusMode: "continuous"`) przez `applyConstraints`, o ile aparat urządzenia i przeglądarka wspierają tę funkcję w `MediaTrackCapabilities`.
- Wykorzystanie natywnego API `ImageCapture` (`takePhoto()`) w przeglądarkach, które je wspierają (Android Chrome / Edge), co pozwala na wykonanie rzeczywistego zdjęcia matrycą w pełnej rozdzielczości i z natywnym przetwarzaniem aparatu (zamiast pobierania pojedynczej klatki wideo).
- Zachowanie bezpiecznego i ulepszonego fallbacku dla przeglądarek bez `ImageCapture` (np. iOS Safari) poprzez zrzut z wysokorozdzielczego elementu `<video>`.
- Uogólnienie kompozycji ramki w `photobooth.ts` na dowolne źródło obrazu (`CanvasImageSource`), zachowując dekoracyjną ramkę motywu wesela i eksport do JPEG o podwyższonej jakości (95%).
- Zwiększenie dopuszczalnego rozmiaru dłuższego boku `MAX_CAPTURE_DIMENSION` z 1920px do 2560px (Quad HD), co gwarantuje krystaliczną ostrość na ekranach Retina i wydrukach.

## Capabilities

### New Capabilities

(brak)

### Modified Capabilities

- `browser-photobooth`: rozszerzenie o przechwytywanie zdjęć w wysokiej rozdzielczości (Full HD/Quad HD), wsparcie dla `ImageCapture` oraz ciągły autofokus.

## Impact

- Modyfikacja `apps/web/src/components/CameraCapture.tsx` oraz `apps/web/src/lib/photobooth.ts`.
- Zero negatywnego wpływu na serwer i procesor Intel N100: kompozycja i skalowanie odbywają się w przeglądarce klienta, a gotowy plik JPEG trafia do istniejącego potoku TUS i kolejki `p-queue(2)`, która generuje miniatury WebP i bezpiecznie zapisuje oryginał.

## Non-goals / Poza zakresem

- Brak zastępowania natywnej aplikacji aparatu systemowego (zwykły upload z dysku nadal pozostaje opcją dla profesjonalnych ujęć 48 MP RAW).
- Brak manualnych suwaków ekspozycji, ISO czy balansu bieli w interfejsie.
- Brak edycji i filtrów barwnych nakładanych po zrobieniu zdjęcia.
