# Proposal

## Why

Aplikacja ma trzy języki (`apps/web/messages/pl.json`, `en.json`, `de.json`, `next-intl`), ale kilka miejsc omija tłumaczenia i pokazuje polski (lub angielski) tekst niezależnie od wybranego języka — także w atrybutach dostępności, więc czytniki ekranu czytają obcy język:

- `LightboxModal.tsx:139,148,228` — `Podgląd multimediów: …`, `Element X z Y`, `Wideo: …` (a klucze `progressCount` i `closeLightbox` w tym samym komponencie już istnieją).
- `MediaGrid.tsx:36` — angielskie `Video`/`Image` w `aria-label`.
- `(legal)/layout.tsx` — „Powrót do strony głównej" i stopka.
- `~offline/page.tsx` i `RefreshButton.tsx` — cały tekst ekranu offline (trasa leży pod `[locale]`, więc tłumaczenie jest możliwe).
- `[locale]/layout.tsx` — `metadata` (tytuł, opis, `appleWebApp.title`) statyczne po polsku.
- `admin/page.tsx` — sr-only „(otwiera się w nowej karcie)" ×6, `alert()` z polskim tekstem.
- `card/page.tsx` — kilka `aria-label` (wybór koloru tekstu/ramki, pole HEX).

## What Changes

- Nowe klucze w `pl.json`, `en.json`, `de.json` (m.in. `GuestGallery.lightboxAria`, `slideAnnouncement`, `videoAria`, `imageAria`; `Common.opensInNewTab`, `Common.backToHome`; namespace `Offline`; klucze aria dla edytora karty), użyte we wskazanych miejscach.
- `generateMetadata` z `getTranslations` w `[locale]/layout.tsx` i `~offline/page.tsx`.
- Test jednoczący pliki tłumaczeń: te same zbiory kluczy w `pl`/`en`/`de` (wykrywa brakujące tłumaczenia w CI).

## Capabilities

### New Capabilities

- `ui-localization`: każdy tekst widoczny lub czytany przez czytniki ekranu w aplikacji pochodzi z plików tłumaczeń i jest dostępny w pl/en/de.

### Modified Capabilities

(brak)

## Impact

- `apps/web/messages/*.json`, wskazane komponenty i strony, nowy test w `apps/web/tests/unit/`.
- Bez zmian API/bazy/backendu. Bez wpływu na N100.
- Uwaga: e2e wymuszają `locale: "pl-PL"` w `playwright.config.ts`, więc polskie teksty w testach pozostają poprawne.

## Non-goals / Poza zakresem

- Brak komunikatów błędów zwracanych przez API (`error: "Galeria nie istnieje"` itp.) — ich lokalizacja to osobny temat kontraktu API.
- Brak zmian treści dokumentów prawnych (`regulamin`, `polityka-prywatnosci`), które już używają namespace `Legal`.
- Brak dodawania nowych języków.
