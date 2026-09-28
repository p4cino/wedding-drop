# Proposal

## Why

Goście po udanym przesłaniu zdjęć nadal widzą je na liście w drawerze uploadu. Przy kolejnym wyborze z rolki łatwo dodać te same pliki ponownie i wysłać duplikaty do galerii. Zgłoszenia użytkowników wskazują, że lista „nie znika” i zachęca do ponownego wysłania.

## What Changes

- Po **udanym** zakończeniu sesji uploadu (wszystkie pliki z kolejki w statusie sukcesu) lista wybranych plików w `UploaderDrawer` czyści się **natychmiast**.
- Przy zamknięciu drawera (X / Escape / po sukcesie) stan listy nie przetrwa do kolejnego otwarcia — drawer startuje z pustą listą.
- Przycisk akcji po pełnym sukcesie nadal zamyka drawer (lub wraca do galerii); nie wymaga ręcznego „sprzątania” listy.
- Aktualizacja testów jednostkowych drawera pod nowe zachowanie.
- Krótka aktualizacja docs, jeśli opisują UX uploadu gościa.

## Capabilities

### New Capabilities

- `guest-upload`: zachowanie draweru uploadu gościa (wybór plików, kolejka, czyszczenie po sukcesie / zamknięciu), bez logowania.

### Modified Capabilities

- (brak — `openspec/specs/` jest puste; to pierwsza capability w tym obszarze)

## Poza zakresem

- Deduplikacja po stronie serwera (hash treści) i blokada duplikatów w DB.
- Deduplikacja po `name+size+lastModified` przy wyborze z rolki.
- Zmiany pipeline TUS / Sharp / FFmpeg / SSE.
- Auto-zamykanie drawera bez interakcji użytkownika (chyba że wynika z istniejącego przycisku „Gotowe”).

## Impact

- **Kod:** `apps/web/src/components/UploaderDrawer.tsx`; testy `apps/web/tests/unit/components/UploaderDrawer.test.tsx`; ewentualnie E2E gościa jeśli asercje zależą od listy po sukcesie.
- **API / N100:** brak — wyłącznie stan UI po stronie klienta; bez wpływu na concurrency, FFmpeg, ZIP ani path safety.
- **Zależności:** bez nowych pakietów.
