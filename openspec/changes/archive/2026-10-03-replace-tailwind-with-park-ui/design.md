# Design

## Context

Aplikacja `apps/web` korzysta obecnie z Next.js 16 (App Router), React 19 oraz Tailwind CSS v4. W stylach (`src/app/globals.css`) zdefiniowane są tokeny kolorystyczne palety ślubnej (`--color-wedding-*`), klasy pomocnicze (m.in. `.glass-panel`, `.font-serif-luxury`) oraz reguły dostępności WCAG (redukcja ruchu, wskaźniki skupienia). Szczegóły motywacji opisano w `proposal.md`.

Przejście na [Park UI](https://park-ui.com) oznacza wdrożenie biblioteki komponentów opartej na bezgłowych maszynach stanów **Ark UI** (`@ark-ui/react`) oraz silniku stylów **Panda CSS** (`@pandacss/dev`) z oficjalnym presetem `@park-ui/panda-preset`.

## Goals / Non-Goals

**Goals:**
- Kompletne zastąpienie Tailwind CSS w `apps/web` przez Panda CSS i Park UI.
- Zachowanie zero-runtime overhead: kompilacja stylów do czystego CSS w procesie budowania (`panda codegen`), bez obciążania procesora serwera Intel N100 w trakcie działania.
- Przeniesienie palety ślubnej (champagne, gold, rose, slate, dark, emerald) oraz typografii do semantycznych tokenów Panda CSS.
- Wykorzystanie natywnych maszyn stanów Ark UI w komponentach nakładkowych (modale, szuflada wgrywania, toasty) w celu zagwarantowania pełnej dostępności (pułapka fokusu, zamykanie Escape, blokada scrolla).
- Płynna integracja z Turborepo, Biome, Dockerem i istniejącym zestawem testów (Vitest, Playwright).

**Non-Goals:**
- Modyfikacja warstwy serwera (`server.ts`), TUS, bazy danych Drizzle czy pipeline przetwarzania mediów Sharp/FFmpeg.
- Zmiana kontraktów API lub parametrów filtrowania mediów (`includeHidden=true`).
- Wprowadzanie bibliotek CSS-in-JS działających w czasie wykonywania kodu (runtime).

## Decisions

### 1. Silnik stylów: Panda CSS z `@park-ui/panda-preset` zamiast wtyczki Tailwind
- **Wybór**: Użycie natywnego ekosystemu Park UI opartego na Panda CSS.
- **Uzasadnienie**: Oficjalny Park UI jest ściśle zintegrowany z Panda CSS. Zapewnia silnie typowane funkcje `css()`, `cva()` i receptury w wygenerowanym katalogu `styled-system/`, pełną zgodność z React Server Components (RSC) oraz brak narzutu w runtime. Starszy plugin Tailwind do Park UI jest nieoficjalny i nierozwijany od dwóch lat.
- **Alternatywa**: Pozostanie przy Tailwind i próba ręcznego stylowania surowego Ark UI. Odrzucono, ponieważ celem jest wdrożenie spójnego systemu wzornictwa Park UI.

### 2. Konfiguracja tokenów i motywu w `panda.config.ts`
- **Wybór**: Rozszerzenie presetu `@park-ui/panda-preset` (akcent `amber`, odcienie szarości `sand`) o niestandardowe tokeny ślubne `wedding`:
  - `wedding.champagne`: `#F7F4EE`
  - `wedding.gold`: `#D4AF37`
  - `wedding.goldLight`: `#F3E5AB`
  - `wedding.rose`: `#E0A899`
  - `wedding.slate`: `#1E293B`
  - `wedding.dark`: `#0F172A`
  - `wedding.emerald`: `#1B4332`
- **Typografia**: Zdefiniowanie rodzin czcionek `serif` (`Playfair Display`, `Cinzel`, `Georgia`) oraz `sans` (`Inter`, system-ui).

### 3. Organizacja komponentów UI ("Open Code")
- **Wybór**: Umieszczenie komponentów Park UI w `apps/web/src/components/ui/` (np. `button.tsx`, `dialog.tsx`, `drawer.tsx`, `input.tsx`, `card.tsx`, `toast.tsx`).
- **Uzasadnienie**: Architektura copy-and-paste Park UI (zbliżona do shadcn) pozwala na pełną kontrolę kodu, dostosowanie wariantów pod kątem estetyki ślubnej (np. warianty `luxury`, `glass`) oraz ścisłe przestrzeganie standardów monorepo bez zewnętrznych czarnych skrzynek.

### 4. Integracja z procesem budowania (Turborepo, Docker, Biome)
- **Generowanie stylów**: Skrypt `"prepare": "panda codegen"` w `apps/web/package.json` oraz krok w `turbo.json` przed `next build`.
- **Docker**: W etapie `builder` wieloetapowego `Dockerfile` wykonanie generowania `styled-system` przed wywołaniem `pnpm --filter @wedding-drop/web build`.
- **Biome & Git**: Katalog `apps/web/styled-system` zostaje dodany do `.gitignore` oraz do sekcji `files.ignore` w `biome.json`, aby uniknąć błędów lintowania w kodzie generowanym automatycznie.

### 5. Bezpieczeństwo i prywatność mediów
- Przy przebudowie komponentów kart galerii i moderacji zachowane zostają dotychczasowe reguły: media ze statusem `hidden` lub `deleted` nigdy nie są renderowane dla nieautoryzowanych gości.

## Risks / Trade-offs

- **[Ryzyko: Konflikty w `biome.json` z generowanym kodem `styled-system`]** → **Mitygacja**: Dodanie ścieżki `**/styled-system/**` do reguł wykluczeń w `biome.json`.
- **[Ryzyko: Błędy budowy w Dockerze w trybie produkcyjnym]** → **Mitygacja**: Generowanie `styled-system` w etapie `builder` (gdzie obecne są devDependencies włącznie z `@pandacss/dev`), dzięki czemu do etapu `runner` trafiają już skompilowane pliki statyczne Next.js.
- **[Ryzyko: Utrata gestów dotykowych (touch swipe) w Lightbox]** → **Mitygacja**: Zachowanie dedykowanych handlerów gestów swipe na urządzeniach mobilnych i weryfikacja za pomocą Playwright Mobile Safari / Chrome.
- **[Ryzyko: Wydłużenie czasu budowania (build time)]** → **Mitygacja**: Panda CSS operuje w trybie incrementalnym z wydajnym parserem AST, generując minimalny arkusz CSS.

## Migration Plan

1. **Instalacja i konfiguracja fundamentu**: Dodanie zależności Panda CSS i Park UI, utworzenie `panda.config.ts`, modyfikacja `postcss.config.mjs`, konfiguracja `biome.json` i `.gitignore`.
2. **Generowanie `styled-system`**: Weryfikacja działania `panda codegen` oraz integracji z `turbo build`.
3. **Wdrożenie komponentów Park UI (`src/components/ui`)**: Instalacja bazowych komponentów (Button, Input, Dialog, Drawer, Card, Toast).
4. **Refaktoryzacja widoków aplikacji**: Stopniowa migracja poszczególnych ekranów i komponentów (Uploader, Lightbox, Księga Gości, Fotobudka, Panel Właściciela, Panel Admina).
5. **Usunięcie Tailwind CSS**: Usunięcie pakietów `tailwindcss` i `@tailwindcss/postcss`, oczyszczenie `globals.css` ze starych dyrektyw Tailwind, usunięcie `tailwind.config.ts`.
6. **Walidacja jakościowa**: Uruchomienie pełnego zestawu testów jednostkowych Vitest, testów E2E Playwright oraz sprawdzenie buildu Docker.
