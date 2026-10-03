# Proposal

## Why

Obecna warstwa wizualna WeddingDrop opiera się na klasach Tailwind CSS v4 z rozproszonymi stylami narzędziowymi w kodzie JSX oraz ręcznie dopracowywanych stanach dostępności (a11y) dla modali i szuflad. Zastąpienie Tailwind CSS systemem [Park UI](https://park-ui.com) (opartym na maszynach stanów Ark UI oraz silniku Panda CSS) wprowadza spójny, silnie typowany system tokenów motywu, dostępność WAI-ARIA z pudełka oraz zero-runtime ekstrakcję stylów w czasie budowy bez obciążania procesora serwera.

## What Changes

- **Usunięcie Tailwind CSS**: Usunięcie pakietów `tailwindcss`, `@tailwindcss/postcss` oraz `tailwind-merge`, wraz z wycofaniem konfiguracji `tailwind.config.ts`.
- **Wdrożenie Panda CSS & Park UI Preset**: Instalacja `@pandacss/dev`, `@park-ui/panda-preset` oraz bazowych bibliotek headless `@ark-ui/react` i `lucide-react`.
- **Konfiguracja tokenów i motywu**: Zdefiniowanie semantycznych tokenów motywu WeddingDrop (kolory champagne, gold, rose, slate, emerald, typografia serif i sans) w `panda.config.ts`.
- **Generowanie warstwy stylów (`styled-system`)**: Integracja `panda codegen` w cyklu budowy (`turbo.json`, `package.json` oraz wieloetapowym `Dockerfile`).
- **Komponenty Park UI**: Zastąpienie ręcznych komponentów interfejsu (przyciski, dialogi/modale, szuflada uploadera, pola formularzy, alerty, karty) komponentami Park UI zbudowanymi na Ark UI.
- **Konfiguracja narzędziowa**: Dodanie katalogu `styled-system` do `.gitignore` oraz reguł ignorowania w `biome.json`.

## Capabilities

### New Capabilities
- `design-system`: System tokenów stylistycznych i dostępnych komponentów UI bazujący na Park UI (Ark UI + Panda CSS), zapewniający spójny wygląd, pełną dostępność klawiatury/czytników ekranu oraz ekstrakcję stylów w czasie kompilacji bez narzutu runtime.

### Modified Capabilities
*(Brak zmian w istniejących specyfikacjach systemowych)*

## Impact

- **Zależności i aplikacje**: Zmiany w `apps/web/package.json` (usunięcie Tailwind, dodanie Panda CSS i Ark UI) oraz `postcss.config.mjs`.
- **Budowanie i Docker**: Wieloetapowy `Dockerfile` i pipeline Turborepo wykonują `panda codegen` przed kompilacją Next.js.
- **Ograniczenia Intel N100**: Zerowy wpływ na wydajność serwera w czasie działania. Panda CSS generuje czyste, statyczne pliki CSS w czasie budowy (zero-runtime overhead), nie obciążając 4 rdzeni Gracemont Intel N100. Pula `p-queue` (concurrency 2), watchdog FFmpeg (25s), strumieniowanie ZIP oraz bezpieczeństwo ścieżek `/data` pozostają w 100% nienaruszone.
- **Narzędzia**: Konfiguracja Biome zaktualizowana o wykluczenie artefaktów generowanych przez Panda CSS (`styled-system/**`).

## Poza zakresem (Non-goals)

- Zmiany w logice biznesowej przesyłania plików TUS, autoryzacji czy operacjach na bazie danych.
- Wprowadzanie bibliotek stylizacji runtime CSS-in-JS (np. styled-components lub Emotion).
- Zmiana układu funkcjonalnego czy struktury podstron (UX przepływów gościa i administratora pozostaje zachowany).
