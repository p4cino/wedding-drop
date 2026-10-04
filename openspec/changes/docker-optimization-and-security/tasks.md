# Tasks

## 1. Higiena zależności i eliminacja podatności krytycznej (Serwist i Google Drive SDK)

- [x] 1.1 Przenieść `@serwist/next` oraz `serwist` z `dependencies` do `devDependencies` w `apps/web/package.json` i zweryfikować brak regresji podczas budowania `pnpm --filter @wedding-drop/web build`
- [x] 1.2 Zastąpić pakiet `googleapis` dedykowanym `@googleapis/drive` w `packages/media/package.json`, zaktualizować importy w `packages/media/src/google-drive.ts` oraz mocki w testach `packages/media/tests/google-drive.test.ts` i zweryfikować poleceniem `pnpm --filter @wedding-drop/media test`

## 2. Modernizacja konfiguracji Next.js 16 (Turbopack i Proxy)

- [x] 2.1 Dodać zmienną środowiskową `SERWIST_SUPPRESS_TURBOPACK_WARNING=1` w `apps/web/next.config.mjs` lub skryptach buildu i zweryfikować czystość logów podczas `pnpm --filter @wedding-drop/web build`
- [x] 2.2 Zmigrować konwencję pliku `apps/web/src/middleware.ts` do `apps/web/src/proxy.ts` zgodnie ze standardem Next.js 16 i zweryfikować działanie routingu oraz testów `pnpm test`

## 3. Optymalizacja i utwardzenie Dockerfile

- [x] 3.1 Zaktualizować etap `runner` w `Dockerfile` o czyszczenie zbędnych globalnych katalogów `/usr/local/lib/node_modules/npm` oraz `/opt/yarn*` i odświeżenie pakietów `apk update && apk upgrade --no-cache`
- [x] 3.2 Skonfigurować uprawnienia katalogów `/app/data` oraz przełączyć proces na użytkownika `USER node` w `Dockerfile`
- [x] 3.3 Zoptymalizować kopiowanie zależności produkcyjnych w etapie runnera i zweryfikować pomyślne zbudowanie obrazu przez `docker build -t wedding-drop-web:latest .`

## 4. Weryfikacja bezpieczeństwa i dokumentacja

- [x] 4.1 Przeprowadzić skanowanie nowego obrazu za pomocą `docker scout quickview` oraz `docker scout cves` i potwierdzić usunięcie podatności krytycznej Go stdlib oraz redukcję rozmiaru poniżej 500 MB
- [x] 4.2 Zaktualizować dokumentację w `README.md` oraz `DOCUMENTATION.md` o informacje dotyczące uprawnień użytkownika `node` i zoptymalizowanego obrazu Docker
