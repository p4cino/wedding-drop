# Proposal

## Why

Evolly łączy w jednym miejscu zdjęcia i "cyfrową księgę gości" (życzenia tekstowe/wideo), a GuestCam ma audio guestbook — to popularny sposób na zebranie życzeń bez papierowej księgi na stole. WeddingDrop dziś pozwala jedynie podpisać zdjęcie imieniem gościa przy uploadzie — nie ma miejsca na samą treść życzenia, niezwiązaną z żadnym plikiem.

## What Changes

- Nowa, oddzielna od zdjęć "księga życzeń": gość może zostawić tekstowe życzenia (imię/nazwisko opcjonalne + treść) bez konieczności wgrywania pliku.
- Nowa zakładka "Życzenia" w galerii gościa (`/g/[slug]`), obok istniejącej siatki zdjęć — lista życzeń aktualizowana na żywo (SSE), analogicznie do zdjęć.
- Panel Pary Młodej (`/owner/[slug]`) dostaje moderację życzeń (ukryj/usuń) korzystającą z tego samego wzorca co dzisiejsza moderacja zdjęć.
- Życzenia wliczają się do eksportu galerii — Para Młoda może pobrać wszystkie życzenia (np. jako plik tekstowy) razem ze zwykłym ZIP-em zdjęć/filmów.

## Capabilities

### New Capabilities

- `guest-wishes-book`: możliwość zostawienia przez gościa tekstowego życzenia dla Pary Młodej, niezależnego od przesyłania zdjęć/filmów, widocznego na żywo i podlegającego tej samej moderacji co media.

### Modified Capabilities

(brak — istniejąca funkcjonalność zdjęć/filmów, ZIP-a i moderacji pozostaje niezmieniona; księga życzeń to nowy, równoległy strumień treści)

## Impact

- Nowa tabela `wishes` w `packages/db/src/schema.ts` (analogiczna do `media_items`: `galleryId`, `guestName`, `message`, `status` (`ready`/`hidden`/`deleted`), `createdAt`) + migracja Drizzle.
- Nowe trasy API: `POST /api/gallery/[slug]/wishes` (dodanie życzenia, publiczne), `GET /api/gallery/[slug]/wishes` (lista, z tym samym filtrowaniem `status` co media), `PATCH /api/owner/[slug]/wishes/[id]/status` (moderacja).
- Rozszerzenie `sse-bus.ts` o zdarzenie `new-wish`/`wish-updated` (ten sam wzorzec co `new-media`/`media-updated`).
- Rozszerzenie eksportu ZIP (`zip-streamer.ts`) o opcjonalny plik tekstowy z życzeniami.
- Zero wpływu na kolejkę `p-queue`/FFmpeg — życzenia to zwykłe wiersze tekstowe w bazie, bez przetwarzania multimediów.

## Non-goals / Poza zakresem

- Brak życzeń audio/wideo w tej iteracji (tylko tekst) — nagrania głosowe to osobna, znacznie większa funkcja (przechwytywanie, przetwarzanie, storage) wykraczająca poza ten wniosek.
- Brak odpowiedzi/wątków pod życzeniami (jednopoziomowa lista, bez komentowania cudzych wpisów).
- Brak edycji własnego życzenia po wysłaniu przez gościa (brak sesji/tożsamości gościa do autoryzacji takiej zmiany) — poprawkę może wykonać tylko Para Młoda przez moderację (ukryj/usuń).
