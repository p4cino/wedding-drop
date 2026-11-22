# Proposal

## Why

Wiodące platformy weselne QR (Kululu, GuestPix, Wedbox, Weddie) budują zaangażowanie gości przy stolikach poprzez natychmiastową interakcję społecznościową i grywalizację: reagowanie serduszkami na wrzucane na żywo zdjęcia, realizację krótkich foto-wyzwań („Upoluj kadr”) oraz wyświetlanie podpisów do ujęć i wpisów z Księgi Życzeń na dużym ekranie w sali weselnej. WeddingDrop posiada już kompletną infrastrukturę czasu rzeczywistego (SSE), szufladę uploadu TUS oraz Tryb TV, dzięki czemu dodanie tego pakietu zamieni pasywne repozytorium plików w żywą atrakcję weselną bez naruszania zasady *Zero Friction* (brak kont i logowania gości).

## What Changes

- **Reakcje na żywo (Serduszka ❤️) i sortowanie „Najpopularniejsze”**:
  - Goście mogą polubić (i cofnąć polubienie) dowolny widoczny materiał (`status: "ready"`) z poziomu siatki galerii oraz Lightboxa bez logowania (stan lokalny w `localStorage` + atomowy licznik `likesCount` w `media_items`).
  - Nowe zdarzenie SSE `media-liked` natychmiast aktualizuje licznik serduszek na wszystkich połączonych telefonach oraz w Trybie TV.
  - Przełącznik sortowania nad siatką galerii gościa: *Najnowsze* (domyślnie) vs *Najpopularniejsze ❤️*.
- **Foto-Wyzwania / Weselne Bingo („Upoluj kadr”)**:
  - Para Młoda w panelu `/owner/[slug]` może włączyć foto-wyzwania i zarządzać listą zadań dla gości (z wbudowanych szablonów PL/EN/DE lub własnych pozycji, np. *„Selfie z Parą Młodą”*, *„Toast przy naszym stoliku”*).
  - W szufladzie uploadu TUS (`UploaderDrawer`) gość może opcjonalnie przypisać wgrywane pliki do wybranego wyzwania (`questId`), a nad galerią pojawia się pasek/widget aktywnych wyzwań z filtrowaniem i szybkim przyciskiem „Dodaj zdjęcie do wyzwania”.
  - Zdjęcia z przypisanym wyzwaniem prezentują odznakę `🎯 <Tytuł wyzwania>` w siatce, Lightboxie i Trybie TV.
- **Krótkie podpisy pod zdjęciami (`caption`) oraz Życzenia w Trybie TV (`/g/[slug]/tv`)**:
  - Opcjonalne pole `caption` (do 140 znaków) w szufladzie uploadu TUS przekazywane w metadanych TUS i zapisywane w `media_items`, niezależnie od pola `uploaderName` (autora).
  - Rozbudowa Trybu TV (`/g/[slug]/tv`): prezentacja podpisu `caption`, odznaki wyzwania i licznika serduszek ❤️ na slajdzie ze zdjęciem oraz automatyczne przeplatanie rotacji zdjęć pełnoekranowymi kartami z widocznych wpisów Księgi Życzeń (`withWishes: true`).

## Capabilities

### New Capabilities
- `gallery/live-reactions`: anonimowe reakcje (serduszka ❤️) pod materiałami w galerii z synchronizacją licznika na żywo przez SSE oraz sortowaniem galerii według popularności.
- `gallery/photo-quests`: zarządzanie foto-wyzwaniami weselnymi przez właściciela galerii, przypisywanie wyzwania podczas uploadu TUS oraz oznaczanie i filtrowanie kadrów z wyzwań.
- `gallery/captions-and-tv-wishes`: opcjonalne podpisy kontekstowe (`caption`) do wgrywanych materiałów oraz wzbogacenie pokazu slajdów Trybu TV o podpisy, odznaki wyzwań, liczniki serduszek i karty z Księgi Życzeń.

### Modified Capabilities
<!-- Brak modyfikacji istniejących specyfikacji w openspec/specs/ -->

## Impact

- **`packages/db`**: rozszerzenie `media_items` o `likesCount` (`integer`, domyślnie `0`), `caption` (`text`, nullable) oraz `questId` (`text`, nullable); rozszerzenie `galleries` o `questsConfig` (`jsonb` z flagą włączenia i listą wyzwań); aktualizacja `tusUploadMetadataDto` i walidatorów Zod + migracja Drizzle.
- **`packages/media`**: przekazanie `caption` i `questId` z `tus-server.ts` do `media-processor.ts`, rozszerzenie `sse-bus.ts` o `notifyMediaLiked`.
- **`apps/web`**: nowy endpoint `POST /api/gallery/[slug]/media/[id]/like` (z izolowanym publicznym kubełkiem rate-limit), rozszerzenie `/api/owner/[slug]/settings` o konfigurację wyzwań, aktualizacja `UploaderDrawer`, `MediaGrid`, `LightboxModal`, panelu właściciela oraz `/g/[slug]/tv`.
- **Wpływ na ograniczenia Intel N100**: zerowy wpływ na kolejkę `p-queue (concurrency: 2)`, watchdog FFmpeg (25 s), strumieniowanie ZIP i izolację ścieżek `/data` — nowe operacje to lekkie aktualizacje metadanych tekstowych/licznikowych w PostgreSQL i komunikaty JSON przez istniejący strumień SSE.

## Non-goals / Poza zakresem

- Brak kont użytkowników i twardego uwierzytelniania gości przy lajkowaniu (zachowujemy 100% *Zero Friction*; ochrona przed spamem opiera się na `localStorage` + rate-limitingu IP).
- Brak wielopoziomowych komentarzy/dyskusji pod zdjęciami (wyłącznie pojedynczy podpis autora `caption` przy uploadzie oraz serduszka od gości).
- Brak automatycznej weryfikacji AI, czy zdjęcie faktycznie przedstawia temat wyzwania (moderacja pozostaje w rękach Pary Młodej).
