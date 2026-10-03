# Tasks

## 1. Setup i fundament Panda CSS / Park UI

- [x] 1.1 Zainstalować zależności `@pandacss/dev`, `@park-ui/panda-preset` oraz `@ark-ui/react` w `apps/web` i zweryfikować pomyślną instalację za pomocą `pnpm install`
- [x] 1.2 Utworzyć `apps/web/panda.config.ts` z konfiguracją presetu Park UI oraz semantycznymi tokenami motywu ślubnego (champagne, gold, rose, slate, dark, emerald) i zweryfikować generowanie `styled-system` poleceniem `pnpm --filter @wedding-drop/web exec panda codegen`
- [x] 1.3 Zaktualizować `apps/web/postcss.config.mjs` do obsługi Panda CSS (`@pandacss/postcss`) i dodać `styled-system` do `.gitignore` oraz sekcji `files.ignore` w `biome.json`, weryfikując poleceniem `pnpm biome check`
- [x] 1.4 Zintegrować generowanie stylów w procesie budowy (skrypt `prepare` w `apps/web/package.json`, konfiguracja zadań w `turbo.json` oraz etap `builder` w `Dockerfile`), weryfikując pomyślnym wykonaniem `pnpm --filter @wedding-drop/web build`

## 2. Komponenty bazowe Park UI

- [x] 2.1 Utworzyć bazowe komponenty Park UI w `apps/web/src/components/ui/` (Button, Input, Card, Badge) oparte na tokenach ślubnych i zweryfikować ich renderowanie nowym testem jednostkowym Vitest w `apps/web/tests/ui-components.test.tsx`
- [x] 2.2 Zaimplementować komponenty nakładkowe Park UI (Dialog, Drawer, Toast) oparte na maszynach stanów Ark UI z obsługą pułapki fokusu i klawisza Escape, weryfikując ich dostępność w testach Vitest

## 3. Migracja komponentów aplikacji na Park UI

- [x] 3.1 Zmigrować `UploaderDrawer.tsx` oraz `Toast.tsx` na komponenty Park UI (`Drawer`, `Toast`), weryfikując obsługę przesyłania plików i zamykania klawiaturą
- [x] 3.2 Zmigrować `LightboxModal.tsx` oraz `CameraCapture.tsx` na komponenty Park UI, zachowując obsługę gestów dotykowych (touch swipe) na mobile, i zweryfikować testami `apps/web/tests/LightboxModal.test.tsx`
- [x] 3.3 Zmigrować komponenty galerii (`MediaGrid.tsx`, `WishesBook.tsx`, `EmptyState.tsx`, `ContributorLeaderboard.tsx`) na tokeny Panda CSS i komponenty Park UI, weryfikując poprawność renderowania testami Vitest

## 4. Migracja paneli administracyjnych i widoków dedykowanych

- [x] 4.1 Zmigrować formularze i listy w panelu właściciela (`apps/web/src/components/owner/*`) oraz panelu administratora (`apps/web/src/components/admin/*`) na komponenty Park UI, weryfikując akcje moderacji i filtry ukrytych mediów
- [x] 4.2 Zmigrować widoki Fotobudki (`apps/web/src/app/[slug]/photobooth`) oraz pokazu slajdów TV (`apps/web/src/app/[slug]/slideshow`) na style Panda CSS, weryfikując responsywność i tryb pełnoekranowy

## 5. Usunięcie Tailwind CSS i sprzątanie

- [x] 5.1 Usunąć zależności `tailwindcss`, `@tailwindcss/postcss`, `tailwind-merge` oraz plik konfiguracyjny `apps/web/tailwind.config.ts`, weryfikując czystość `apps/web/package.json`
- [x] 5.2 Oczyścić `apps/web/src/app/globals.css` ze starych dyrektyw Tailwind (`@import "tailwindcss"`, `@theme`), zaimportować wygenerowany arkusz stylów Panda CSS i zweryfikować brak osieroconych klas Tailwind
- [x] 5.3 Zaktualizować dokumentację (`README.md` oraz `DOCUMENTATION.md`) o opis nowego systemu wzornictwa Park UI / Panda CSS zgodnie z wymogiem AGENTS.md §7 i zweryfikować spójność dokumentacji

## 6. Weryfikacja końcowa i testy regresyjne

- [x] 6.1 Uruchomić pełny zestaw testów jednostkowych `pnpm test` we wszystkich pakietach monorepo i zweryfikować 100% zaliczenia
- [x] 6.2 Uruchomić testy E2E Playwright `pnpm --filter @wedding-drop/web test:e2e` na profilach Desktop i Mobile, weryfikując brak regresji interakcyjnych
- [x] 6.3 Przeprowadzić końcową walidację Biome i TypeScript `pnpm biome check apps/ packages/` oraz `pnpm check-types` i zweryfikować brak błędów
