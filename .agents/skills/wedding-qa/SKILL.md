---
name: wedding-qa
description: >-
  Use this skill when the user asks to run, debug, analyze, or write unit tests (Vitest) or End-to-End tests (Playwright) for the WeddingDrop application, verify test coverage, or check for regressions across Desktop Chromium, Mobile Chrome, and Mobile Safari.
---

# WeddingDrop QA: Testy Jednostkowe, Integracyjne i E2E

Ten skill zawiera kompleksowe procedury uruchamiania i analizowania testów automatycznych w projekcie **WeddingDrop**.

---

## 1. Architektura Testów

Projekt posiada 2-poziomową piramidę testów:
1. **Testy Jednostkowe i Integracyjne (Vitest)**:
   - **80 testów** w dwóch niezależnych pakietach:
     - `packages/media/tests/`: 28 testów jednostkowych potoku mediów (Sharp, FFmpeg, TUS, SSE bus, QR, PDF, Google Drive).
     - `apps/web/tests/`: 52 testy integracyjne tras API (`admin`, `gallery`, `owner`) oraz komponentów UI (`LightboxModal`, `MediaGrid`, `UploaderDrawer`).
   - Pokrywają logikę biznesową: weryfikację tokenów HMAC-SHA256, timing-safe weryfikację, sanityzację slugów, parsery TUS, singleton SSE (`__wedding_sse_bus__`), strumieniowanie ZIP i generowanie PDF A6.
2. **Testy End-to-End (Playwright)**:
   - **32 unikalne scenariusze (łącznie 96 testów)** uruchamianych w macierzy 3 profili:
     - `Desktop Chromium`
     - `Mobile Chrome` (Pixel 5 viewport)
     - `Mobile Safari` (iPhone 13 / WebKit viewport)
   - Pliki w katalogu `apps/web/e2e/`.

Szczegółowy wykaz wszystkich 32 scenariuszy znajduje się w podręczniku [test-scenarios.md](./references/test-scenarios.md).

---

## 2. Uruchamianie Testów Jednostkowych (Vitest)

### Opcja A: Szybki runner w środowisku deweloperskim (Node.js / Turborepo)
```bash
# Uruchomienie wszystkich 80 testów Vitest w całym monorepo
pnpm turbo run test
# lub
pnpm -r test

# Uruchomienie testów dla konkretnego pakietu
pnpm --filter @wedding-drop/media test
pnpm --filter @wedding-drop/web test

# Uruchomienie w trybie śledzenia zmian (watch)
pnpm --filter @wedding-drop/web exec vitest

# Uruchomienie z raportem pokrycia kodu (coverage)
pnpm --filter @wedding-drop/web test:coverage
```

### Opcja B: Uruchomienie w odizolowanym kontenerze Docker
Gwarantuje identyczne środowisko jak na serwerze CI/CD (Node 24 Alpine):
```bash
docker run --rm -v "${PWD}:/app" -w /app node:24-alpine sh -c "corepack enable && pnpm -r test"
```

---

## 3. Uruchamianie Testów End-to-End (Playwright)

Testy E2E weryfikują działanie aplikacji w rzeczywistych przeglądarkach w komunikacji z backendem i bazą danych.

### Opcja A: W kontenerze Docker (Zalecane na serwerze i maszynach deweloperskich)
Uruchamia testy z oficjalnym obrazem Playwright w sieci kontenerów:
```bash
docker run --rm \
  --network wedding-drop_wedding_net \
  -v wedding_playwright_browsers:/ms-playwright \
  -v "${PWD}:/app" -w /app/apps/web \
  -e BASE_URL=http://wedding_web:3000 \
  mcr.microsoft.com/playwright:v1.50.0-noble npx playwright test
```

### Opcja B: Lokalnie na maszynie deweloperskiej
Gdy aplikacja działa lokalnie na `http://localhost:3000`:
```bash
# Uruchomienie pełnego zestawu Playwright
pnpm --filter @wedding-drop/web test:e2e

# Uruchomienie tylko na telefonach (Mobile Safari)
pnpm --filter @wedding-drop/web exec playwright test --project="Mobile Safari"

# Uruchomienie w trybie z podglądem interfejsu (UI mode)
pnpm --filter @wedding-drop/web exec playwright test --ui

# Generowanie raportu HTML
pnpm --filter @wedding-drop/web exec playwright show-report
```

---

## 4. Wygodny Skrypt Pomocniczy (Test Runner)

W repozytorium przygotowano skrypt TypeScript w `.agents/scripts/test-runner.ts`:
```bash
# Szybkie uruchomienie Vitest
npx tsx .agents/scripts/test-runner.ts vitest

# Szybkie uruchomienie Playwright
npx tsx .agents/scripts/test-runner.ts e2e

# Pełny raport pokrycia
npx tsx .agents/scripts/test-runner.ts coverage
```

---

## 5. Typowe Problemy i Rozwiązania (Troubleshooting)

- **Błąd bazy danych w testach integracyjnych**:
  - Upewnij się, że testy korzystają z mocków lub kontenera testowego. Pliki w `tests/` wykorzystują zamockowane moduły PostgreSQL i bibliotek Sharp/FFmpeg.
- **Timeout w Playwright (Mobile Safari / WebKit)**:
  - Upewnij się, że serwer deweloperski działa pod adresem podanym w `BASE_URL` (`http://localhost:3000` lub kontener `http://wedding_web:3000`).
  - Gesty dotykowe (Touch Swipe) w testach gościa symulują zdarzenia `touchstart` / `touchmove` / `touchend`.
