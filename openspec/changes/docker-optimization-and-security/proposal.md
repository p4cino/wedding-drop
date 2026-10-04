# Proposal

## Why
Obraz produkcyjny `wedding-drop-web:latest` osiągnął nadmierny rozmiar **1.42 GB** oraz wykazuje **81 podatności** (w tym 1 Critical i 25 High w Docker Scout). Głównymi przyczynami są:
1. Skopiowanie do obrazu uruchomieniowego (warstwa 15) całego wirtualnego magazynu `.pnpm` (822 MB) zamiast selektywnych modułów produkcyjnych.
2. Zależność `@serwist/next` i `serwist` w `dependencies` runtime, która ciągnie `@serwist/build` oraz kompilator TypeScript 7 z natywnym silnikiem w Go 1.26.4 (podatność krytyczna CVE-2026-39821, CVSS 9.6).
3. Monolityczna biblioteka `googleapis` (205 MB) w `packages/media` zamiast dedykowanego pakietu `@googleapis/drive`.
4. Pozostałości zbędnych globalnych narzędzi `npm` i `yarn` z podatnościami (`http-cache-semantics 4.2.0`, `undici`, itp.) w obrazie bazowym `node:24-alpine`.
Dodatkowo proces budowania emituje ostrzeżenia Next.js 16 dotyczące integracji `@serwist/next` z Turbopackiem oraz deprecacji pliku `middleware.ts` na rzecz konwencji `proxy.ts`.

## What Changes
1. **Higiena zależności runtime**:
   - Przeniesienie `@serwist/next` oraz `serwist` z `dependencies` do `devDependencies` w `apps/web/package.json` (SW jest kompilowany w fazie build i serwowany statycznie z `public/sw.js`).
   - Zastąpienie `googleapis` przez `@googleapis/drive` w `packages/media/package.json` oraz aktualizacja importów w `src/google-drive.ts` i testach.
2. **Optymalizacja i utwardzenie Dockerfile**:
   - Odświeżenie obrazu bazowego `node:24-alpine` z aktualizacją pakietów systemowych (`apk update && apk upgrade --no-cache`).
   - Usunięcie zbędnych globalnych katalogów `/usr/local/lib/node_modules/npm` oraz `/opt/yarn*` w etapie runnera.
   - Usunięcie kopiowania zbędnego roota `/app/node_modules` (822 MB) na rzecz precyzyjnie przyciętych zależności produkcyjnych i/lub dystrybucji Next.js.
   - Konfiguracja bezpiecznego kontekstu uruchomieniowego niebędącego rootem (`USER node` z uprawnieniami do `/app/data`).
3. **Modernizacja konfiguracji Next.js 16**:
   - Wyciszenie ostrzeżenia Serwist Turbopack w konfiguracji build (`SERWIST_SUPPRESS_TURBOPACK_WARNING=1`).
   - Migracja konwencji pliku `apps/web/src/middleware.ts` do `apps/web/src/proxy.ts` zgodnie ze specyfikacją Next.js 16.

## Capabilities

### New Capabilities
Brak nowych funkcjonalności biznesowych (zmiana o charakterze optymalizacyjnym, infrastrukturalnym i bezpieczeństwa).

### Modified Capabilities
Brak zmian w kontraktach wymagań użytkowników końcowych (funkcjonalność PWA, routing wielojęzyczny oraz zachowanie galerii pozostają niezmienne).

## Impact
- **Rozmiar obrazu:** Redukcja z 1.42 GB do szacowanych ~350–450 MB (spadek o ponad 65%).
- **Podatności (CVE):** Całkowita eliminacja podatności krytycznej Go stdlib oraz usunięcie ponad 70% podatności High.
- **Intel N100 Constraints:**
  - Ograniczenia `concurrency: 2` (p-queue) oraz 25-sekundowy watchdog FFmpeg (`SIGKILL`) pozostają nienaruszone.
  - Ograniczenie pamięci kontenera (1024 MB w `docker-compose.yml`) zyskuje znaczny margines dzięki mniejszemu narzutowi wirtualnego magazynu pnpm.
  - Streaming archiwów ZIP oraz reguły bezpieczeństwa ścieżek (`path.resolve()`) nie ulegają zmianie.
- **Pliki i pakiety:** `Dockerfile`, `apps/web/package.json`, `packages/media/package.json`, `packages/media/src/google-drive.ts`, `apps/web/next.config.mjs`, `apps/web/src/proxy.ts`.

## Non-goals / Poza zakresem
- Zmiana silnika bazodanowego lub zmiana schematu Drizzle ORM.
- Przebudowa logiki Service Workera (`src/app/sw.ts`) poza dostosowaniem zależności pakietowych.
- Własna kompilacja FFmpeg ze źródeł (pozostajemy przy oficjalnych bezpiecznych pakietach Alpine).
