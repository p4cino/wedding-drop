# Tasks

## 1. Baza danych i metadane

- [x] 1.1 Dodanie kolumny `mediaType` (np. `photo`, `video`, `audio`) do schematu Drizzle w `packages/db` oraz wygenerowanie migracji. Weryfikacja: `pnpm db:push` / `pnpm db:migrate` kończy się sukcesem bez błędów.
- [x] 1.2 Aktualizacja zapytań Drizzle w API (pobieranie galerii), aby zwracały pole `mediaType`. Weryfikacja: unit testy API zwracają poprawne pole w JSON.

## 2. Przetwarzanie multimediów w locie (packages/media)

- [x] 2.1 Rozszerzenie hooka TUS `onUploadCreate` / `onUploadFinish`, aby poprawnie kategoryzował wrzucane typy (MIME type na `audio/*` i `video/*`). Weryfikacja: Wrzucenie testowego wideo przez TUS zapisuje rekord z odpowiednim `mediaType`.
- [x] 2.2 Zaktualizowanie kolejki `p-queue` z zachowaniem `concurrency: 2`. Dodanie obsługi wideo przez proces potomny FFmpeg z hard watchdogiem 25s (`AbortController` lub `child_process.kill()`). Weryfikacja: unit test FFmpeg watchdoga na sztucznie zapętlonym skrypcie musi zostać ubity.
- [x] 2.3 Rozszerzenie streamera ZIP (`archiver`), aby sortował pliki do `/audio/` i `/video/` w zależności od `mediaType`. Weryfikacja: pobranie testowego ZIPa z galerii zwraca poprawną strukturę podfolderów.

## 3. Frontend (Nagrywanie w przeglądarce)

- [x] 3.1 Dodanie komponentu `AudioVideoRecorder` (korzystającego z MediaRecorder API) do modułu wgrywania. Weryfikacja: komponent renderuje się w przeglądarce, pozwala nagrać plik i odtworzyć przed wysłaniem.
- [x] 3.2 Ograniczenie maksymalnego czasu nagrywania (np. 60 sekund) po stronie klienta oraz zablokowanie wrzucania bardzo długich nagrań. Weryfikacja: timer odcina nagranie po upływie limitu i wymusza zakończenie.
- [x] 3.3 Dodanie fallbacku `accept="video/*,audio/*" capture="environment"` dla urządzeń nie wspierających MediaRecorder API (Safari iOS). Weryfikacja: w Safari na starym iOS kliknięcie wywołuje natywną kamerę.
- [x] 3.4 Połączenie nagranego bloba z klientem TUS (TusClient). Weryfikacja: udany upload wideo odzwierciedlony paskiem postępu aż do 100%.

## 4. Odtwarzanie w galerii

- [x] 4.1 Zaktualizowanie siatki (Grid) galerii na żywo – dodanie ikonek dla wideo/audio na kafelkach (np. znaczek play/fala dźwiękowa). Weryfikacja: nowe kafelki wyraźnie różnią się wizualnie od zdjęć.
- [x] 4.2 Zaktualizowanie modala (Lightbox), aby renderował element `<video>` lub `<audio>` zamiast `<img>` w zależności od `mediaType`. Weryfikacja: swipeowanie na telefonie nie aktywuje przypadkowo paska odtwarzacza wideo.
- [x] 4.3 Zaktualizowanie dokumentacji końcowej (README.md / DOCUMENTATION.md) dodając informacje o opcjach guestbooka audio/wideo oraz wymaganiach wideo. Weryfikacja: pliki dokumentacji zawierają odpowiedni paragraf o nowych funkcjach (AGENTS.md §7).
