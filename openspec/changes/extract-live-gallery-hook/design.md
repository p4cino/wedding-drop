# Design

## Context

Trzy strony klienckie mają własne kopie: `new EventSource`, `isLiveConnected`, `JSON.parse` w try/catch, deduplikację po `id` i filtrowanie `hidden`/`deleted`. Galeria gościa dodatkowo koryguje indeks lightboxa wewnątrz updaterów `setItems` (osobna zmiana: `fix-lightbox-open-item-tracking`).

## Goals / Non-Goals

**Goals:**
- Jedna implementacja subskrypcji i reducera, testowalna bez DOM (czysta funkcja).
- Wyeliminować dryf zachowania między gościem a TV.

**Non-Goals:**
- Zmiany serwera SSE lub schematu zdarzeń.
- Globalny store (Zustand/Redux) — wystarczy hook per strona.

## Decisions

- **Dwie warstwy hooków.** `useGalleryEvents(slug, { onEvent, onOpen, onError })` zajmuje się wyłącznie `EventSource` (cleanup, `isLive`, parsowanie JSON z bezpiecznym pominięciem błędnych ramek). `useLiveGallery` łączy go z `useReducer(galleryReducer)`. Panel właściciela używa tylko niższej warstwy (dodatkowe zdarzenia `gdrive-progress`).
- **Reducer w `lib/live-gallery.ts`:** `galleryReducer(state, action)` z akcjami `loaded`, `new-media`, `media-updated`, `new-wish`, `wish-updated`. Czysty, bez efektów ubocznych — łatwe testy Vitest bez jsdom.
- **Ponowne pobranie:** `refetch()` woła publiczne `GET /api/gallery/[slug]`, `/media`, `/wishes`. Wywoływane przy `onOpen` po wcześniejszym `onError` oraz po sygnale uploadu z drawera (`refetchWithBackoff([0, 1000, 2500, 5000])` z anulowaniem przy odmontowaniu, zastępuje `setTimeout` z `g/[slug]/page.tsx:369-371`).
- **Status:** rozróżnienie `notFound` (HTTP 404) i `error` (wyjątek/5xx) — dziś `tv/page.tsx` traktuje każdy błąd jako `notFound`.
- **Typy:** `lib/gallery-types.ts` staje się źródłem prawdy; docelowo może być zasilany z kontraktu trasy API. `MediaItemData`/`WishItemData` przenoszone z komponentów, aby `lib/leaderboard.ts` przestał importować z `components`.
- **Prywatność:** hook nie przyjmuje tokenów. Widok TV nadal nie może przekazywać `ownerToken` (patrz test e2e UC10 „parametry sugerujące dostęp właściciela w URL TV"). Reducer odrzuca `hidden`/`deleted` także po stronie klienta, jako druga linia obrony obok filtrowania w API.

## Risks / Trade-offs

- [Ryzyko: regresja w zachowaniu galerii gościa przy migracji na reducer] → Mitigacja: testy reducera odwzorowują dotychczasowe scenariusze (duplikat, ukrycie, wstawienie na górę) przed wymianą strony; e2e `guest-journey` i UC TV zostają bez zmian.
- [Ryzyko: nadmiarowe pobrania po flapowaniu sieci] → Mitigacja: `refetch` po wznowieniu debounce'owany (jeden na 1 s); brak wpływu na serwer wykraczający poza dotychczasowe polling-i.
