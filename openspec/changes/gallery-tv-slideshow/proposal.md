# Proposal

## Why

Konkurencja (Kululu, GuestCam, Guesticon) traktuje "pokaz na żywo na telewizorze/rzutniku w sali" jako flagową funkcję, bo widok zdjęć w czasie rzeczywistym na dużym ekranie napędza kolejne uploady gości. WeddingDrop ma już galerię na żywo (SSE), ale wyłącznie na telefonach gości — nie ma widoku zaprojektowanego pod wyświetlacz w sali weselnej.

## What Changes

- Nowa, publiczna, tylko-do-odczytu trasa `/g/[slug]/tv` — pełnoekranowy pokaz slajdów bez nawigacji i bez przycisku uploadu, zasilany tym samym mechanizmem SSE co istniejąca galeria gościa (`/api/gallery/[slug]/live`).
- Automatyczna rotacja miniatur/zdjęć w pełnej rozdzielczości (`rawUrl`) w ustalonych odstępach czasu; nowo wgrane zdjęcie/wideo wskakuje na wierzch rotacji zaraz po zdarzeniu `new-media`.
- Duży kod QR w rogu ekranu (reużycie istniejącego `generateQrSvg` z `packages/media/src/qr-generator.ts`), by goście patrzący na telewizor mogli dołączyć.
- W panelu Pary Młodej (`/owner/[slug]`) nowy link/przycisk "Otwórz tryb TV", by można było wkleić adres do smart TV / laptopa podłączonego do rzutnika.
- Materiały o statusie `hidden`/`deleted` nigdy nie trafiają do tego widoku (dziedziczy filtrowanie z istniejącego publicznego endpointu `media`).

## Capabilities

### New Capabilities

- `gallery-tv-slideshow`: publiczny, wyświetleniowy-only pełnoekranowy pokaz slajdów galerii ślubnej przeznaczony do wyświetlania na telewizorze/projektorze w sali, aktualizowany na żywo przez SSE.

### Modified Capabilities

(brak — żadna istniejąca funkcjonalność nie zmienia zachowania; tylko nowy, dodatkowy widok korzystający z istniejących, niezmodyfikowanych endpointów)

## Impact

- Nowy plik trasy: `apps/web/src/app/[locale]/g/[slug]/tv/page.tsx` (komponent kliencki, reużywa `/api/gallery/[slug]/live` + `/api/gallery/[slug]/media`, bez nowych endpointów API).
- Drobna zmiana w `apps/web/src/app/[locale]/owner/[slug]/page.tsx` (dodanie linku do trybu TV).
- Zero zmian w `packages/media` (kolejka p-queue, FFmpeg, ZIP) i zero nowych zapytań do bazy — funkcja czysto prezentacyjna po stronie przeglądarki, więc nie ma wpływu na ograniczenia sprzętowe N100.

## Non-goals / Poza zakresem

- Brak natywnej integracji Chromecast/AirPlay SDK w tej iteracji — strona działa jako zwykła podstrona web, którą wyświetla się przez przeglądarkę smart TV lub funkcję "rzutuj kartę" z laptopa/telefonu.
- Brak konfigurowalnego layoutu/motywu pokazu slajdów (jeden, domyślny układ).
- Brak dodatkowej moderacji w tym widoku ponad tę, która już istnieje w panelu właściciela.
