# Design

## Context

Zobacz `proposal.md` — sekcja „Why”. Projekt wykorzystuje wspólny serwer HTTP (`apps/web/server.ts`), wznawialny serwer TUS (`packages/media/src/tus-server.ts`), kolejkę obróbki multimediów `p-queue` o współbieżności `2` (`packages/media/src/media-processor.ts`), globalną magistralę zdarzeń SSE (`packages/media/src/sse-bus.ts`) oraz wspólny reducer stanu galerii na żywo po stronie klienta (`apps/web/src/lib/live-gallery.ts` i `useLiveGallery.ts`). Wszystkie trzy nowe funkcje rozszerzają istniejące przepływy danych w `packages/db`, `packages/media` oraz `apps/web` bez wprowadzania nowych pakietów ani zewnętrznych zależności.

## Goals / Non-Goals

**Goals:**
- Zachowanie 100% *Zero Friction* dla gości (brak logowania i rejestracji przy polubieniach, wyborze wyzwań i dodawaniu podpisów).
- Pełna ochrona ograniczeń sprzętowych Intel N100: zero dodatkowych operacji Sharp/FFmpeg, atomowe operacje SQL dla liczników polubień i natychmiastowa dystrybucja zmian przez istniejące połączenie SSE.
- Ścisłe zachowanie niezmienników prywatności: materiały i życzenia o statusie `hidden`, `pending` lub `deleted` nigdy nie są ujawniane ani modyfikowane przez publiczne endpointy gości ani prezentowane w Trybie TV.

**Non-Goals:**
- Śledzenie tożsamości lajkujących gości po stronie bazy danych (brak tabeli użytkowników/sesji lajków) — patrz `proposal.md` (Non-goals).
- Zmiana układu fizycznego wydruku kart A6 PDF (wyzwania i reakcje są funkcjami interaktywnymi w aplikacji webowej i Trybie TV).

## Decisions

1. **Model reakcji: atomowy licznik `likesCount` w `media_items` + pamięć `localStorage` klienta zamiast osobnej tabeli `media_likes`.**
   - *Uzasadnienie*: Na weselu goście nie zakładają kont, a wiele telefonów korzysta z jednego adresu IP sali weselnej (NAT Wi-Fi). Tworzenie osobnej tabeli z odciskami palców przeglądarek komplikowałoby schemat i zapytania agregujące `COUNT(*)` przy każdym odczycie galerii. Kolumna `likesCount integer NOT NULL DEFAULT 0` w `media_items` aktualizowana atomowo (`GREATEST(0, likes_count + 1)` / `GREATEST(0, likes_count - 1)`) przez `POST /api/gallery/[slug]/media/[id]/like` (`{ action: "like" | "unlike" }`) daje odczyt `O(1)` bez `JOIN`, a przeglądarka gościa pamięta zbiór polubionych ID w `localStorage` pod kluczem `wd_likes_<slug>`.
   - *Ochrona przed nadużyciami*: Endpoint używa `recordRateLimitHit("media-like", `${ip}:${slug}`, ANON_WRITE_LIMIT)` (lub dedykowanego limitu `60/min` w `publicStore`), co izoluje ruch od `authStore` i chroni bazę przed zalaniem zapytaniami `UPDATE`.

2. **Model foto-wyzwań: kolumna `questsConfig` (`jsonb`) w tabeli `galleries` oraz `questId` (`text`) w `media_items` zamiast osobnej tabeli relacyjnej.**
   - *Uzasadnienie*: Lista wyzwań należy wyłącznie do jednej galerii, liczy maksymalnie 20 pozycji (`{ enabled: boolean, items: Array<{ id: string, title: string }> }`) i jest zawsze pobierana razem z metadanymi galerii (`GET /api/gallery/[slug]` oraz sesja właściciela). Przechowywanie jej jako silnie typowanego `jsonb` w `galleries` (analogicznie do `exportProgress` w `gallery_gdrive_exports`) unika dodatkowego zapytania SQL przy każdym wejściu gościa.
   - *Walidacja podczas uploadu TUS*: `tusUploadMetadataDto` przyjmuje opcjonalny `questId` (sanityzowany do `^[a-z0-9_-]{1,40}$`). W `media-processor.ts`, gdy plik jest zapisywany do `media_items`, procesor sprawdza, czy `questId` istnieje w `gallery.questsConfig?.items`; jeśli nie (lub wyzwania są wyłączone), zapisuje `questId: null`. Dzięki temu usunięcie wyzwania przez Parę Młodą nie psuje integralności bazy ani trwających uploadów.

3. **Przekazywanie podpisu `caption` i `questId` przez metadane protokołu TUS.**
   - *Uzasadnienie*: `tus-js-client` już koduje metadane w nagłówku `Upload-Metadata` przy tworzeniu uploadu (`POST /api/upload/tus`). Rozszerzenie `tusUploadMetadataDto` o `caption` (`z.string().trim().max(140).optional()`) oraz `questId` (`z.string().trim().max(40).optional()`) pozwala przekazać oba pola w jednym żądaniu z plikiem bez tworzenia osobnego endpointu `PATCH` po zakończeniu uploadu.

4. **Przeplatanie zdjęć i Księgi Życzeń w Trybie TV po stronie klienta (`useLiveGallery` z `withWishes: true`).**
   - *Uzasadnienie*: Hook `useLiveGallery` oraz `galleryReducer` w `apps/web/src/lib/live-gallery.ts` już obsługują życzenia (`wishes`, zdarzenia `new-wish` i `wish-updated`), a Tryb TV dotąd wywoływał go z `withWishes: false`. Zmiana na `withWishes: true` i zbudowanie czystej funkcji selektora listy slajdów (`buildTvSlides(items, wishes)` — np. wstawiającej kartę życzenia co 4 zdjęcia lub pokazującej same życzenia, gdy `items.length === 0`) nie wymaga żadnych zmian w API `/api/gallery/[slug]/wishes` ani `/api/gallery/[slug]/live`. Zdarzenie `new-wish` (tak samo jak `new-media`) ustawia aktualny slajd na nowo dodany element, dając natychmiastowy efekt „na żywo” na ekranie projektora.

5. **Synchronizacja stanu `media-liked` w `galleryReducer` bez resetowania Lightboxa.**
   - *Uzasadnienie*: Zgodnie z konstytucją projektu (`AGENTS.md` §5), zdarzenia SSE w tle nie mogą resetować indeksu otwartego Lightboxa. `useLightboxSelection` śledzi otwarty element po jego `id`, a akcja `media-liked` w `galleryReducer` jedynie podmienia pole `likesCount` istniejącego elementu w tablicy `items`. Przy sortowaniu „Najpopularniejsze” zmiana kolejności lub indeks otwartego zdjęcia w `useLightboxSelection` podąża za `selectedId`, dzięki czemu przeglądane zdjęcie w powiększeniu pozostaje stabilne.

## Risks / Trade-offs

- **[Ryzyko: Skoki kolejności kafelków podczas przeglądania w trybie sortowania „Najpopularniejsze”, gdy inni goście klikają serduszka na żywo]** → *Mitigacja*: W `useLightboxSelection` aktywne zdjęcie jest powiązane po `id` (nie po surowym indeksie tablicy), więc nawet przy zmianie pozycji na liście otwarty Lightbox nie przeskoczy na inne zdjęcie.
- **[Ryzyko: Wyyczyszczenie `localStorage` lub tryb prywatny pozwala temu samemu gościowi kliknąć serduszko ponownie]** → *Mitigacja*: Świadomy kompromis projektowy dla zachowania *Zero Friction* (brak logowania gości); rate-limiter po IP (`publicStore`) ogranicza masowe nabijanie licznika skryptem.
- **[Ryzyko: Długie życzenie lub podpis `caption` zasłania zdjęcie na ekranie Trybu TV]** → *Mitigacja*: `caption` jest ograniczony walidatorem Zod do 140 znaków i wyświetlany w eleganckiej półprzezroczystej pigułce z `line-clamp: 2`, a życzenia (`wishes`, do 500 znaków) są prezentowane jako osobne, pełnoekranowe slajdy typograficzne pomiędzy zdjęciami.

## Migration Plan

1. Wygenerowanie i zastosowanie migracji Drizzle w `packages/db` dodającej kolumny z bezpiecznymi wartościami domyślnymi:
   - `ALTER TABLE "media_items" ADD COLUMN "likes_count" integer DEFAULT 0 NOT NULL;`
   - `ALTER TABLE "media_items" ADD COLUMN "caption" text;`
   - `ALTER TABLE "media_items" ADD COLUMN "quest_id" text;`
   - `ALTER TABLE "galleries" ADD COLUMN "quests_config" jsonb;`
2. Wszystkie nowe kolumny są nullable lub posiadają `DEFAULT 0`, więc migracja jest w 100% wstecznie kompatybilna z istniejącymi galeriami i nie wymaga przestoju ani konwersji istniejących plików w `/data`.
