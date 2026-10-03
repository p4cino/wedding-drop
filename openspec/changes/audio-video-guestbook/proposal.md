# Proposal

## Why

Obecnie goście mogą udostępniać jedynie zdjęcia. Pary młode bardzo oczekują możliwości zbierania krótkich życzeń w formie nagrań audio i wideo (tzw. "głos babci"), co dodaje pamiątkom ogromnej wartości emocjonalnej. Chcemy umożliwić gościom nagrywanie i przesyłanie takich wiadomości bezpośrednio z przeglądarki, po zeskanowaniu tego samego kodu QR.

## What Changes

- Dodanie nowej opcji „Życzenia” (nagrywanie audio/wideo) w uploaderze dostępnym dla gości po zeskanowaniu kodu QR.
- Nagrywanie audio za pomocą MediaRecorder API w przeglądarce z opcją odsłuchania przed wysłaniem.
- Nagrywanie wideo bezpośrednio z kamery urządzenia w przeglądarce.
- Nałożenie limitów długości nagrania (np. 60 sekund) i kompresja po stronie serwera za pomocą istniejącego potoku FFmpeg (zgodnie z limitami Intel N100).
- Dostosowanie widoku galerii na żywo (oraz mechanizmów moderacji), aby obsługiwały odtwarzanie wpisów audio i wideo.
- Zmiana struktury tworzonych paczek ZIP, aby życzenia lądowały w osobnych podfolderach `audio/` oraz `video/` obok standardowych zdjęć.

## Capabilities

### New Capabilities
- `audio-video-guestbook`: Obsługa nagrywania, przesyłania, przetwarzania oraz odtwarzania krótkich wiadomości audio/wideo od gości, w tym moderacja i odpowiednie formatowanie przy eksporcie ZIP.

### Modified Capabilities


## Impact

- **Frontend (`apps/web`)**: Integracja MediaRecorder API (dostęp do mikrofonu/kamery), nowe komponenty UI do nagrywania i odtwarzania w galerii (Lightbox).
- **Backend/Media Pipeline (`packages/media`)**: Obsługa nowych formatów w TUS upload, transkodowanie FFmpeg. Rygorystyczne przestrzeganie `concurrency: 2` w `p-queue` i 25-sekundowego watchdoga dla wideo, by nie przeciążyć procesora Intel N100. Rozszerzenie generatora strumienia ZIP (archiver) o odpowiednie katalogi.
- **Baza Danych (`packages/db`)**: Dodanie informacji o typie pliku lub dedykowanych tagów/metadanych pozwalających odróżnić życzenia od zwykłych zdjęć w tabeli multimediów.

## Poza zakresem (Non-goals)

- Opcja Dial-in (wykupywanie prawdziwego numeru telefonu, na który można dzwonić).
- Rozbudowany trymer wideo / edytor po stronie klienta.
- Automatyczna transkrypcja audio do tekstu (STT).
