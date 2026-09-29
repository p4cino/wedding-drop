# Proposal

## Why

Edytor karteczki na stół (`apps/web/src/app/[locale]/g/[slug]/card/page.tsx`, 366 linii) ma kilka błędów i słabości, które ujawniają się w realnym użyciu:

- **Brak obsługi nieistniejącej galerii:** gdy `GET /api/gallery/[slug]` zwróci 404, `loadData` po prostu kończy ładowanie (`if (res.ok)`), a strona pokazuje przykładowe „Katarzyna & Tomasz 12.09.2026" jako gotowy do wydruku podgląd — użytkownik może wydrukować kartę z cudzymi imionami i kodem QR do nieistniejącej galerii.
- **Wyścig w generowaniu QR:** efekt wywołuje `QRCode.toDataURL(...).then(setQrDataUrl)` bez `.catch` i bez flagi anulowania — przy szybkiej zmianie koloru starszy wynik może nadpisać nowszy; fallback `http://localhost:3000/g/${slug}` to zbędna gałąź.
- **Duplikacja budowania URL:** `buildTvGalleryQrUrl` z `lib/tv-slideshow.ts` robi to samo co inline w `card/page.tsx`.
- **Drobiazgi:** `PRESET_PALETTES` (z tłumaczonymi nazwami) tworzone przy każdym renderze; `key={line}` przy powtarzających się liniach instrukcji daje zduplikowane klucze; query string PDF sklejany ręcznie zamiast `URLSearchParams`; domyślne kolory karty (`#1E293B`, `#D4AF37`) powtórzone w stronie i w `api/gallery/[slug]/route.ts`.

## What Changes

- Stan `status: "loading" | "ready" | "notFound" | "error"` w edytorze; dla `notFound` ekran „galeria nie znaleziona" (wspólny `GalleryStatusScreen`), bez podglądu karty i bez przycisków druku/PDF.
- Generowanie QR z flagą anulowania i `.catch` (błąd → brak QR + komunikat, bez nieobsłużonego odrzucenia); wspólny helper `buildGalleryUrl(slug, origin?)` w `lib/gallery-url.ts` (dotychczasowe `buildTvGalleryQrUrl` staje się jego cienkim aliasem lub zostaje zastąpione).
- Dane palet na poziomie modułu (`PRESET_PALETTES` z kluczami tłumaczeń, nazwy tłumaczone przy renderze); stałe `DEFAULT_CARD_COLORS` we wspólnym module używanym też przez API.
- `URLSearchParams` dla zapytania PDF, stabilne klucze linii instrukcji (`${index}-${line}`).
- Wydzielenie `CardPreview` (podgląd A6) z pliku strony.

## Capabilities

### New Capabilities

- `table-card-editor`: edytor karteczki obsługuje brak galerii i błędy generowania kodu QR oraz pokazuje spójny podgląd.

### Modified Capabilities

(brak — generowanie PDF po stronie serwera bez zmian)

## Impact

- `apps/web/src/app/[locale]/g/[slug]/card/page.tsx`, nowy `components/CardPreview.tsx`, `lib/gallery-url.ts`, drobna zmiana importu w `tv/page.tsx` i `api/gallery/[slug]/route.ts` (stałe kolorów).
- Endpoint `GET /api/gallery/[slug]/card/pdf` nietknięty (ten sam kontrakt parametrów `headline`, `primaryColor`, `accentColor`, `instructions`).
- N100: bez wpływu (QR po stronie klienta jak dziś).

## Non-goals / Poza zakresem

- Brak zmian w generatorze PDF (`packages/media/src/pdf-card.ts`).
- Brak nowych motywów ani funkcji edytora.
- Brak zmian w zapisie ustawień karty po stronie właściciela.
