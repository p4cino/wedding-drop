# Design

## Context
Projekt to `WeddingDrop`. Mamy istniejący moduł `packages/media`, który odpowiada za procesowanie zdjęć przy użyciu Sharp oraz wideo za pomocą FFmpeg (limitowanego przez p-queue i watchdoga) po otrzymaniu pliku przez serwer TUS. Zobacz `proposal.md` po więcej szczegółów biznesowych dlaczego wprowadzamy nagrywanie wideo i audio.
Rozszerzamy istniejące `packages/media` i uploader zamiast tworzyć nowe moduły, zgodnie z regułą projektową.

## Goals / Non-Goals

**Goals:**
- Nagrywanie audio za pomocą MediaRecorder API po stronie przeglądarki, obsługa mikrofonu.
- Nagrywanie wideo za pomocą MediaRecorder API po stronie przeglądarki, obsługa kamery (przód/tył do wyboru).
- Użycie TUS do wgrywania plików audio/wideo.
- Transkodowanie plików wideo w tle, z twardym zabiciem (SIGKILL po 25s), żeby nie spalić Intel N100.
- Dodanie obsługi odtwarzania w Lightboxie w aplikacji webowej, zachowując bezkolizyjne gesty dotykowe.
- Poprawne kategoryzowanie (w bazie Drizzle ORM) typów plików (audio/video), co pozwoli w locie utworzyć foldery w strumieniu archivera ZIP.

**Non-Goals:**
- Nagrywanie w 4K (obciążenie dla Intel N100) — wymusimy 720p/1080p lub skompresujemy do 720p.
- Cięcie / sklejanie wideo (trymer klienta/serwera) — wgrywamy surowy klip "jak leci".

## Decisions

1. **Formaty po stronie klienta**
   - **Audio**: Format WebM lub MP4 (zależnie od przeglądarki - Safari preferuje MP4/AAC, Chrome WebM/Opus). Serwer transkoduje na powszechny MP3/AAC dla pewności przy pobieraniu w ZIP.
   - **Wideo**: MediaRecorder zazwyczaj produkuje WebM (Chrome) lub MP4 (Safari). Serwer transkoduje to przez FFmpeg na uniwersalne H.264 MP4.

2. **Baza Danych (packages/db)**
   - W tabeli przechowującej pliki (np. `media` / `photos`) dodamy kolumnę `type: 'photo' | 'video' | 'audio'` (jeśli jej nie ma) oraz kolumnę powiązaną (np. `isGuestbook: boolean` lub `category: 'guestbook'`).
   - Zachowujemy zasady prywatności: zapytania API dotyczące galerii pomijają statusy `hidden`/`deleted` dla wszystkich zapytań nieautoryzowanych.

3. **Limitowanie FFmpeg (Intel N100)**
   - Wideo z przeglądarki może być uciążliwe (zmienne klatki VFR). Używamy prostych, jednoprzebiegowych presetów `ultrafast` / `veryfast` FFmpeg, aby skrócić czas trwania na N100.
   - Watchdog 25s: Jeśli gość wgra 2-minutowe wideo i N100 nie wyrobi się w 25s (np. użyje 100% z 4 rdzeni Gracemont dla 2 procesów), proces zostanie zabity (SIGKILL), a plik oznaczony jako błąd. Dzięki temu system się nie "zatka". (Dlatego na froncie nałożymy limit np. 30s-60s).

4. **ZIP Streaming (packages/media)**
   - W pliku generującym ZIP zmienimy logikę budowania ścieżki wpisu w paczce. Jeśli plik ma przypisaną kategorię guestbook i typ `audio`, umieścimy go w `audio/nazwa.mp3`. W przeciwnym razie pozostanie w strukturze zdjęć. Nie buforujemy — strumieniowanie po HTTP `Transfer-Encoding: chunked`.

## Risks / Trade-offs

- **Risk**: Safari na iOS czasem ma problemy z MediaRecorder API w starszych wersjach.
  - **Mitigation**: Użyjemy domyślnego elementu `<input type="file" accept="video/*,audio/*" capture="environment">` jako fallback, który na telefonie po prostu otworzy natywną kamerę/dyktafon, co jest w 100% stabilne.
- **Risk**: Przeciążenie procesora przy transkodowaniu (FFmpeg) pomimo p-queue=2.
  - **Mitigation**: Ograniczenie czasu trwania nagrania po stronie frontendu (do ok. 60 sekund). Stosowanie sprzętowej akceleracji QSV (Intel Quick Sync Video) dla H.264, jeśli dostępne w kontenerze Alpine. Zmniejszenie rozdzielczości wyjściowej (np. max 720p).
