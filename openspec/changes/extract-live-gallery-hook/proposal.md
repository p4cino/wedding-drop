# Proposal

## Why

Ta sama logika „galeria na żywo" jest dziś skopiowana w trzech miejscach: `apps/web/src/app/[locale]/g/[slug]/page.tsx` (SSE + pobranie danych + 3 niesprzątane `setTimeout` jako „fallback poll"), `.../g/[slug]/tv/page.tsx` (komentarz sam przyznaje „identycznie jak w galerii gościa") oraz fragment w `card/page.tsx` i `owner/[slug]/page.tsx` (własny `EventSource`). Kopie już się rozjechały: widok TV nie pobiera danych ponownie po zerwaniu SSE, więc po chwilowej utracie sieci wyświetla stan sprzed rozłączenia. Typy `GalleryData` (zdefiniowany dwa razy z różnymi polami) i `MediaItemData` (mieszka w komponencie `LightboxModal.tsx`, a importuje go m.in. `lib/leaderboard.ts` — zależność `lib` → `components`) też są rozproszone. Ekrany „ładowanie" i „galeria nie znaleziona" są skopiowane 1:1 między galerią gościa a TV.

## What Changes

- Nowy hook `useGalleryEvents(slug, handlers)` (`apps/web/src/hooks/`) — jedyne miejsce tworzące `EventSource` na `/api/gallery/[slug]/live`, z parsowaniem zdarzeń, flagą `isLive` i wywołaniem `onReconnect` po ponownym połączeniu.
- Nowy hook `useLiveGallery(slug)` zbudowany na powyższym: zwraca `{ gallery, items, wishes, status: "loading" | "ready" | "notFound" | "error", isLive, refetch }`. Logika zdarzeń (`new-media`, `media-updated`, `new-wish`, `wish-updated`) trafia do czystego reducera w `apps/web/src/lib/live-gallery.ts`.
- Ponowne pobranie danych po zerwaniu/wznowieniu SSE (również w widoku TV) oraz po uploadzie (zastępuje trzy niesprzątane `setTimeout` jednym `refetchWithBackoff` z cleanupem).
- Wspólne typy `GalleryData`, `MediaItemData`, `WishItemData` w `apps/web/src/lib/gallery-types.ts` (komponenty i `lib/` importują stąd; `LightboxModal.tsx` i `WishesBook.tsx` tylko re-eksportują na czas migracji).
- Wspólny komponent `GalleryStatusScreen` (`loading` / `notFound` / `error`, wariant jasny i ciemny) używany przez galerię gościa i TV.
- `g/[slug]/page.tsx` i `tv/page.tsx` korzystają z hooka; `card/page.tsx` używa tego samego pobierania danych galerii.

## Capabilities

### New Capabilities

- `live-gallery-sync`: jednolity kontrakt pobierania i aktualizacji na żywo danych publicznej galerii (media + życzenia) w klientach gościa i TV.

### Modified Capabilities

(brak — zewnętrznie widoczne zachowanie galerii gościa pozostaje takie samo; jedyna zmiana to wznowienie danych w widoku TV po utracie połączenia)

## Impact

- Kod tylko po stronie klienta (`apps/web/src/hooks`, `apps/web/src/lib`, `apps/web/src/components`, trzy strony). Bez zmian API, bazy i `packages/*`.
- Bez wpływu na `p-queue`, FFmpeg, ZIP ani ścieżki plików. Liczba połączeń SSE na stronę pozostaje 1.
- Prywatność: hook używa wyłącznie publicznych endpointów (`GET /api/gallery/[slug]`, `/media`, `/wishes`, `/live`) i nie przyjmuje ani nie wysyła tokenu właściciela; reducer dodatkowo odrzuca elementy `hidden`/`deleted`.
- Zmiana kolejności prac: ta zmiana jest fundamentem dla `fix-lightbox-open-item-tracking`.

## Non-goals / Poza zakresem

- Brak zmian formatu zdarzeń SSE po stronie serwera (`packages/media/src/sse-bus.ts`).
- Zdarzenia Google Drive (`gdrive-progress`) w panelu właściciela obsługuje `refactor-owner-panel-state`; ta zmiana dostarcza tylko wspólny `useGalleryEvents`.
- Brak przepisywania siatki galerii ani lightboxa.
