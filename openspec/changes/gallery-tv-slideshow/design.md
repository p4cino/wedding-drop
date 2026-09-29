# Design

## Context

Zobacz `proposal.md` — sekcja „Why”. Istniejąca galeria gościa (`apps/web/src/app/[locale]/g/[slug]/page.tsx`) już pobiera listę materiałów (`GET /api/gallery/{slug}/media`) i nasłuchuje na `GET /api/gallery/{slug}/live` (SSE, zdarzenia `new-media` / `media-updated` z `packages/media/src/sse-bus.ts`). Oba te endpointy już filtrują `status: "ready"` po stronie serwera dla żądań bez poświadczeń właściciela/admina — tryb TV będzie z nich korzystał bez żadnych zmian API.

## Goals / Non-Goals

**Goals:**
- Nowy, w pełni kliencki widok `/g/[slug]/tv`, zero nowych endpointów API.
- Płynna rotacja z naturalnym wejściem nowych zdjęć bez przeskoków/migotania.
- Działa jako zwykła karta przeglądarki — da się ją "rzucić" na telewizor (Chromecast tab-cast, AirPlay z laptopa, wbudowana przeglądarka smart TV) bez żadnej integracji SDK.

**Non-Goals:**
- Integracja z natywnymi SDK Chromecast/AirPlay (patrz `proposal.md` — Non-goals).
- Konfigurowalność (motywy, czas rotacji, layout) w tej iteracji — jeden, stały układ.
- Autoodtwarzanie wideo z dźwiękiem.

## Decisions

- **Reużycie istniejących endpointów zamiast nowego API.** `/api/gallery/{slug}/media` i `/api/gallery/{slug}/live` już wymuszają `status: "ready"` dla żądań bez `x-owner-token`/`x-admin-token`/hasła — tryb TV po prostu nigdy nie wysyła tych nagłówków, więc dziedziczy niezmiennik bezpieczeństwa "hidden/deleted niewidoczne dla gościa" bez dodatkowego kodu do utrzymania. Alternatywa (dedykowany endpoint `/api/gallery/{slug}/tv-feed`) odrzucona jako niepotrzebne powielenie logiki filtrowania.
- **Rotacja po stronie klienta na podstawie lokalnego stanu, nie nowego mechanizmu push.** Widok trzyma tablicę materiałów w stanie React (jak istniejąca galeria gościa), a `setInterval` przesuwa indeks aktualnie prezentowanego elementu; zdarzenie SSE `new-media` wstawia nowy element na początek kolejki i natychmiast go pokazuje (analogicznie do istniejącego zachowania w `g/[slug]/page.tsx`, które wstawia nowe zdjęcie na szczyt listy).
- **Materiały wideo pokazywane jako statyczna miniatura (`thumbUrl`), nie `<video autoplay>`.** Prostszy i bezpieczniejszy wybór niż `<video muted autoplay>` — unika przypadków, w których przeglądarka smart TV blokuje autoplay wideo mimo `muted`, co skutkowałoby zawieszonym slajdem. Miniatura wideo (klatka wygenerowana już dzisiaj przez FFmpeg w `media-processor.ts`) wystarcza w kontekście "co dzieje się na weselu w tej chwili".
- **QR kod generowany po stronie klienta z istniejącej biblioteki `qrcode`, nie serwowany jako predefiniowany plik PNG.** Trasa `/g/[slug]/tv` może wygenerować SVG w przeglądarce z linkiem do `/g/[slug]` (ten sam wzorzec co reużywalny `generateQrSvg`, ale wywołany po stronie klienta biblioteką `qrcode` już obecną w zależnościach `packages/media`), więc nie trzeba nowego route'a do serwowania obrazka.

## Risks / Trade-offs

- [Ryzyko: pauza w rotacji przy dużym napływie zdjęć naraz (np. tuż po torcie) może sprawić, że najstarsze z "nowej fali" zdjęć nigdy się nie pokażą, zanim rotacja przejdzie dalej] → Mitigacja: kolejka nowych zdjęć ma limit (np. ostatnie 200 pozycji) i rotuje po prostu przez wszystkie, insert na początek — przy typowym tempie wesela (nie setki zdjęć na sekundę) to wystarczające; nie wymaga dodatkowej logiki kolejkowania po stronie serwera.
- [Ryzyko: ekran telewizora usypia/wygasza się po czasie bezczynności] → Mitigacja: strona okresowo odtwarza niewidoczny, niemy element wideo/`requestWakeLock()` (Screen Wake Lock API, jeśli dostępne w przeglądarce smart TV) — traktowane jako ulepszenie best-effort, nie twardy wymóg (nie każda przeglądarka TV je wspiera).
- [Ryzyko: otwarcie linku trybu TV przez gościa (a nie tylko Parę Młodą) ujawnia adres do "podglądania" galerii bez dodawania zdjęć] → Mitigacja: to jest zamierzone (widok jest z definicji publiczny/tylko-do-odczytu, tak samo jak dzisiejsza galeria gościa) — nie stanowi nowego ryzyka prywatności, bo pokazuje dokładnie te same materiały co zwykła galeria.
