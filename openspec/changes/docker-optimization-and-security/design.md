# Design

## Context
Obraz produkcyjny Docker `wedding-drop-web:latest` generowany dla architektury Intel N100 cierpi na nadmierny rozmiar (1.42 GB) oraz 81 podatności zgłaszanych przez Docker Scout. Analiza wykazała, że głównym powodem jest skopiowanie całego magazynu `.pnpm` (822 MB) do runnera, nieoptymalne zależności deweloperskie w sekcji runtime (`@serwist/next` ciągnący kompilator TypeScript/Go) oraz pakiet monolityczny `googleapis` (205 MB). Dodatkowo proces budowania Next.js 16 generuje ostrzeżenia o integracji Serwist z Turbopack oraz o deprecacji `middleware.ts`.

## Goals / Non-Goals

**Goals:**
- Zredukować rozmiar obrazu Dockera do poziomu ~350–450 MB.
- Wyeliminować podatność krytyczną `CVE-2026-39821` (`golang/stdlib`) oraz usunąć podatności z nieużywanych pakietów globalnych NPM/Yarn.
- Zastąpić monolit `googleapis` przez dedykowany `@googleapis/drive` w `packages/media`.
- Wyciszyć ostrzeżenie Turbopacka w Serwist i zmigrować `middleware.ts` do `proxy.ts` zgodnie ze standardem Next.js 16.
- Uruchamiać proces Node.js jako nieuprzywilejowany użytkownik `USER node` zamiast `root`.

**Non-Goals:**
- Modyfikacja logiki kolejkowania zadań (`p-queue` z `concurrency: 2`) ani timeoutu FFmpeg (25s `SIGKILL`).
- Przebudowa architektury streamowania archiwów ZIP czy mechanizmów autoryzacji tokenów HMAC.
- Zmiana bazowego obrazu systemu na Debian/Ubuntu (pozostajemy przy zoptymalizowanym `node:24-alpine`).

## Decisions

### 1. Przeniesienie `@serwist/next` i `serwist` do `devDependencies`
* **Decyzja:** W [apps/web/package.json](file:///apps/web/package.json) przenosimy `@serwist/next` i `serwist` z `dependencies` do `devDependencies`.
* **Uzasadnienie:** Service Worker (`public/sw.js`) jest w pełni kompilowany podczas fazy budowania aplikacji (`next build`). W środowisku uruchomieniowym Node.js nie potrzebuje modułów kompilatora ani wtyczki Serwist – plik `sw.js` jest serwowany jako zwykły zasób statyczny przez Next.js. Usunięcie tych pakietów z runtime dependencies zapobiega instalacji `@serwist/build` oraz kompilatora `typescript@7.0.2` (który w wersji Linux zawiera binarkę w Go 1.26.4 z podatnością krytyczną).
* **Rozważane alternatywy:** Pozostawienie w `dependencies` i ignorowanie flagi bezpieczeństwa w CI – odrzucone ze względu na standardy bezpieczeństwa projektu.

### 2. Migracja z `googleapis` na `@googleapis/drive` w `packages/media`
* **Decyzja:** Wycofanie `googleapis: ^182.0.0` na rzecz `@googleapis/drive: ^9.0.0` (lub kompatybilnej wersji v3).
* **Uzasadnienie:** `googleapis` waży w katalogu `.pnpm` ponad 205 MB, ponieważ zawiera definicje i kod dla kilkuset serwisów Google Cloud. W WeddingDrop integracja ogranicza się wyłącznie do Google Drive v3 (tworzenie folderów, upload plików, uprawnienia). `@googleapis/drive` dostarcza identyczne API (`drive_v3.Drive`, `auth.OAuth2Client`), ważąc zaledwie ułamek tej wielkości.
* **Rozważane alternatywy:** Dynamiczny import lub ręczne zapytania HTTP do Google Drive API – odrzucone, ponieważ oficjalny klient `@googleapis/drive` zachowuje pełne bezpieczeństwo typów i obsługę odświeżania tokenów OAuth 2.0 bez pisania własnego boilerplate'u.

### 3. Optymalizacja warstw w `Dockerfile` i czyszczenie runnera
* **Decyzja:**
  - W etapie `runner` usuwamy zbędne katalogi dostarczane fabrycznie w obrazie `node:24-alpine`:
    `RUN rm -rf /usr/local/lib/node_modules/npm /opt/yarn* /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn*`
  - Odświeżamy pakiety Alpine poleceniem `apk update && apk upgrade --no-cache`, co usuwa podatności w bibliotekach systemowych (np. `libvpx`).
  - Tworzymy katalogi danych `/app/data/galleries` i `/app/data/tus_temp` z przypisaniem uprawnień dla wbudowanego użytkownika `node:node` (`chown -R node:node /app/data`).
  - Przełączamy wykonanie na `USER node`.
* **Rozważane alternatywy:** Obraz Distroless – odrzucony, ponieważ aplikacja wymaga obecności binarnego `ffmpeg` z repozytorium Alpine oraz minimalnego środowiska powłoki dla skryptów healthchecka.

### 4. Konfiguracja Next.js 16: Turbopack i Proxy
* **Decyzja:**
  - W konfiguracji `apps/web/next.config.mjs` lub zmiennych środowiskowych procesu budowania definiujemy `SERWIST_SUPPRESS_TURBOPACK_WARNING=1`, co wycisza fałszywy alarm o braku kompatybilności z Turbopackiem w fazie build.
  - Zgodnie z wytycznymi Next.js 16 migrujemy `apps/web/src/middleware.ts` do `apps/web/src/proxy.ts`, zachowując kompatybilność z `next-intl/middleware`.
* **Rozważane alternatywy:** Pozostawienie ostrzeżeń deprecacji – odrzucone w celu zapewnienia czystości logów CI i przygotowania bazy kodu na kolejne wersje Next.js.

## Risks / Trade-offs

- **[Ryzyko]** Przełączenie na `USER node` może spowodować błędy uprawnień zapisu w wolumenach zamontowanych z hosta (`/app/data`).
  → **Mitygacja:** W `Dockerfile` upewniamy się, że domyślny katalog `/app/data` ma właściciela `node:node` (UID/GID 1000). W dokumentacji `README.md` zawrzemy informację o uprawnieniach folderu hosta.
- **[Ryzyko]** Zmiana nazwy `middleware.ts` na `proxy.ts` w Next.js 16 może wpłynąć na routing i18n (`next-intl`).
  → **Mitygacja:** Weryfikacja działania przekierowań językowych za pomocą istniejącego zestawu testów jednostkowych i E2E (Playwright `guest-journey.spec.ts`).
- **[Ryzyko]** Różnice w typach w `@googleapis/drive` względem `googleapis`.
  → **Mitygacja:** Przetestowanie modułu `packages/media/src/google-drive.ts` oraz uruchomienie dedykowanych testów `packages/media/tests/google-drive.test.ts`.

## Migration Plan
1. Aktualizacja zależności w `apps/web/package.json` i `packages/media/package.json`.
2. Aktualizacja kodu `packages/media/src/google-drive.ts` pod kątem importów z `@googleapis/drive`.
3. Migracja `apps/web/src/middleware.ts` ➔ `apps/web/src/proxy.ts` oraz dodanie flagi wyciszającej ostrzeżenie Serwist.
4. Modyfikacja `Dockerfile` (czyszczenie globalnych pakietów npm/yarn, odświeżenie apk, konfiguracja użytkownika `node`).
5. Uruchomienie testów lokalnych (`pnpm test`, `pnpm check-types`).
6. Zbudowanie nowego obrazu Dockera i weryfikacja przez `docker scout cves` oraz `docker images`.
