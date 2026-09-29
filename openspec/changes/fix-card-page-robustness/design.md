# Design

## Context

Strona edytora trzyma `coupleNames`, `weddingDate`, `headline`, `instructions`, kolory, `qrDataUrl` i `loading` w osobnych `useState`, z przykładowymi wartościami domyślnymi, które maskują błąd pobrania. Wspólne pobieranie danych galerii jest przedmiotem `extract-live-gallery-hook`.

## Goals / Non-Goals

**Goals:**
- Poprawność (404, wyścig QR) przy minimalnej zmianie struktury.

**Non-Goals:**
- Przepisanie edytora, zmiana wyglądu karty.

## Decisions

- **Status pobrania:** `type LoadStatus = "loading" | "ready" | "notFound" | "error"`; `404` → `notFound`, wyjątek/5xx → `error`. Wartości przykładowe wyłącznie dla `ready`, gdy pola są puste.
- **QR:** `useEffect` z `let cancelled = false; QRCode.toDataURL(...).then(url => { if (!cancelled) set(url) }).catch(...)`; cleanup ustawia `cancelled = true`. URL z `buildGalleryUrl(slug, window.location.origin)`; wersja SSR nie jest potrzebna, bo efekt działa tylko w przeglądarce.
- **`lib/gallery-url.ts`:** `buildGalleryUrl(slug, origin)`; `buildTvGalleryQrUrl` z `lib/tv-slideshow.ts` deleguje do niej (albo zostaje zastąpione, jeśli wygodniej), z zachowaniem istniejących testów `tv-slideshow.test.ts`.
- **Kolory domyślne:** `DEFAULT_CARD_COLORS` w `lib/card-defaults.ts` importowane przez stronę i trasę API galerii.
- **`CardPreview`:** czysty komponent prezentacyjny, przyjmuje `coupleNames`, `weddingDate`, `headline`, `lines`, kolory, `qrDataUrl`.
- **Prywatność:** brak zmian; endpoint publiczny galerii zwraca te same pola co dziś.

## Risks / Trade-offs

- [Ryzyko: `notFound` zmienia zachowanie wobec dotychczasowego „zawsze pokaż podgląd"] → Mitigacja: to poprawka błędu opisana w specyfikacji; e2e `card-customizer` używa istniejącej galerii i nie powinien się zmienić.
- [Ryzyko: kolizja z `extract-live-gallery-hook` (wspólne pobieranie)] → Mitigacja: ta zmiana nie zależy od hooka; jeśli hook jest wdrożony wcześniej, korzysta z jego statusów.
