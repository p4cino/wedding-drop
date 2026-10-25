# Design

## Context

Zobacz `proposal.md` w celu zapoznania się z motywacją oraz listą 16 podatności (F-01 do F-16). Aplikacja działa jako zunifikowany proces Node.js (`apps/web/server.ts` budowany przez `tsup` do `dist/server.js`), który obsługuje bezpośrednio `/api/upload/tus` oraz `/media-file/*`, natomiast pozostałe żądania przekazuje do handlera Next.js 16 App Router. Ze względu na osobne bundlowanie `dist/server.js` oraz tras Next.js, zmienne modułowe w `apps/web/src/lib/auth.ts` istnieją w dwóch niezależnych instancjach w tym samym procesie V8, o ile nie zostaną osadzone w `globalThis`.

## Goals / Non-Goals

**Goals:**
- Domknięcie wszystkich 16 podatności (F-01 do F-16) przy zachowaniu 100% kompatybilności z istniejącą architekturą monorepo oraz inwariantami sprzętowymi Intel N100 (`p-queue(2)`, `25s SIGKILL`, strumieniowy ZIP).
- Wyeliminowanie rozszczepienia stanu pamięci podręcznej w procesie Node.js pomiędzy `dist/server.js` a Next.js App Router.
- Zachowanie pełnej wstecznej kompatybilności kontraktów testowych (w tym `Path=/api` dla ciasteczek właściciela zgodnie ze specyfikacją `owner-session`).

**Non-Goals:**
- Wprowadzanie zewnętrznego magazynu sesji (np. Redis) — aplikacja celowo pozostaje jednowęzłowa (PostgreSQL + Node.js).

## Decisions

### 1. Polityka Fail-Closed w `/media-file/*` oraz separacja `tus_temp` (F-01, F-03, F-14, F-15)

- **Decyzja**: W `handleMediaFileRequest` (`apps/web/src/lib/media-file-handler.ts`):
  1. Wymuszamy prefiks `galleries/` dla znormalizowanej ścieżki względnej (`!normalizedRelPath.startsWith("galleries/")` → `403 Forbidden`).
  2. Jeśli zapytanie do tabeli `media_items` (z `INNER JOIN galleries`) zwraca pustą tablicę (`matchingItems.length === 0`), natychmiast zwracamy `404 Not Found` (fail-closed).
  3. Rozszerzamy projekcję SQL o `allowGuestViewing: galleries.allowGuestViewing` oraz `isActive: galleries.isActive`. Jeżeli `item.isActive === false` lub `item.allowGuestViewing === false`, dostęp bez ważnego tokenu właściciela lub administratora jest blokowany kodem `403 Forbidden`.
  4. Usuwamy `.svg` z mapy `MIME_TYPES` i dodajemy nagłówek `Content-Security-Policy: default-src 'none'; sandbox` dla wszystkich odpowiedzi `/media-file/*`.
  5. Dla mediów niepublicznych (`status !== "ready"`, `guestPassword` ustawione, lub `allowGuestViewing === false`) ustawiamy `Cache-Control: private, no-store`, a w `apps/web/src/app/sw.ts` wykluczamy `/media-file/` z cache'owania Service Workera.
- **Alternatywy**: Przeniesienie `tus_temp` poza `DATA_DIR` — odrzucone jako niewystarczające samo w sobie, ponieważ Docker montuje pojedynczy wolumen `/app/data`; wymuszenie prefiksu `galleries/` + fail-closed na bazie danych + usunięcie `ownerToken` z metadanych TUS zapewnia wielowarstwową ochronę (Defense-in-Depth).

### 2. Czyszczenie `ownerToken` i plików `.json` w TUS oraz kryptograficzne ID (F-01, F-06, F-08)

- **Decyzja**:
  1. W `packages/media/src/tus-server.ts` zastępujemy `Math.random()` przez `crypto.randomBytes(12).toString("hex")`.
  2. Po weryfikacji `verifyOwnerCredentials(slug, parsedMeta.data.ownerToken)` w `onUploadCreate`, zwracamy kopię metadanych bez klucza `ownerToken` (`const { ownerToken: _ stripped, ...safeMetadata } = metadata`). Dzięki temu `@tus/file-store` nigdy nie zapisuje tokenu na dysku w `<uploadId>.json`, ani nie zwraca go w `HEAD /api/upload/tus/<id>`.
  3. W `packages/media/src/media-processor.ts` zaraz po `fs.rename(tempFilePath, targetRawPath)` (oraz przy usuwaniu odrzuconego pliku) usuwamy również plik metadanych `${tempFilePath}.json` oraz `${tempFilePath}.info` (`fs.unlink(...).catch(() => {})`).
  4. Śledzimy aktywne rezerwacje bajtów TUS w `globalThis.__weddingDropTusInFlight` oraz ponownie wywołujemy `checkStorageLimit` wewnątrz `processMediaTask` przed zapisem rekordu do bazy danych.

### 3. Stan autoryzacji w `globalThis` i wiązanie sesji gościa z hasłem (F-02, F-10, F-11)

- **Decyzja**:
  1. W `apps/web/src/lib/auth.ts` przechowujemy `runtimeFallbackSecret` oraz `revokedJtis` w `globalThis.__weddingDropAuthState`. Jeśli `ADMIN_SECRET` i `OWNER_SECRET` nie są ustawione, ale podano `ADMIN_PASSWORD` lub `DATABASE_URL`, derywujemy deterministyczny sekret zapasowy HMAC-SHA256 z tych zmiennych (z losowym fallbackiem w `globalThis`, gdy nic nie jest ustawione).
  2. W `generateGuestToken(slug, guestPasswordHash?)` oraz `verifyGuestToken(token, slug, guestPasswordHash?)` dołączamy skrót z `guestPasswordHash` (jeśli przekazano) do wiadomości HMAC lub weryfikujemy go, zachowując pełną kompatybilność dla wywołań bez drugiego argumentu.
  3. W `GET /api/owner/[slug]/session` przed wydaniem nowego tokenu unieważniamy dotychczasowy token (`revokeToken(token)`), co zapobiega mnożeniu sesji i przepełnieniu bufora `revokedJtis`.

### 4. Izolacja kubełków Rate Limitera i nadpisywanie `X-Forwarded-For` (F-05)

- **Decyzja**:
  1. W `Caddyfile` dodajemy `header_up X-Forwarded-For {remote_host}` w bloku `reverse_proxy web:3000`.
  2. W `apps/web/src/lib/rate-limit.ts` rozdzielamy przechowalnię dla krytycznych kubełków uwierzytelniania (`admin-login`, `owner-login`, `owner-password`, `guest-login`, `zip-pin`) od kubełków publicznych (`tus-create`, `wishes-post`), aby masowy ruch na publicznych endpointach nie mógł wyprzeć wpisów blokad brute-force.
  3. W `authorizeHiddenAccess` (`apps/web/src/lib/auth.ts`) resetujemy licznik `owner-password` po poprawnym uwierzytelnieniu hasłem.

### 5. Jednorazowość `state` w Google OAuth i walidacja PDF/DTO (F-07, F-12, F-13)

- **Decyzja**:
  1. W `packages/media/src/google-drive.ts` dodajemy rejestr zużytych `nonce` w `globalThis.__weddingDropConsumedOAuthStates` (z czasem życia 15 minut). Każde wywołanie `verifySignedState` odrzuca powtórnie użyty `nonce`. Dodatkowo `POST /api/auth/google` ustawia ciasteczko `wd_gdrive_oauth_state` (HttpOnly, SameSite=Lax), które `GET /api/auth/google/callback` weryfikuje, jeśli jest obecne w żądaniu.
  2. W `PUT /api/owner/[slug]/card` oraz `GET /api/gallery/[slug]/card/pdf` walidujemy dane przez `updateCardSettingsDto.safeParse`, a w `packages/media/src/pdf-card.ts` filtrujemy znaki spoza WinAnsi (`[^\x20-\x7E\n\r]`) po transliteracji polskich znaków i walidujemy kolory HEX.

## Risks / Trade-offs

- **[Ryzyko] Zmiana hasła gościa wylogowuje aktualnie zalogowanych gości** → Jest to pożądane zachowanie bezpieczeństwa (F-11); goście mogą natychmiast zalogować się ponownie nowym hasłem.
- **[Ryzyko] Równoległe testy jednostkowe współdzielące `globalThis`** → Eksportujemy funkcje czyszczące stan dla testów oraz dbamy o deterministyczne zachowanie przy mockach w Vitest.
- **[Decyzja 7] Statyczny `ffmpeg` z `mwader/static-ffmpeg` i oczyszczenie `prod-deps` w `Dockerfile`**: Zamiast `apk add ffmpeg` (które instaluje w Alpine 3.24 80+ pakietów dynamicznych z 42 otwartymi podatnościami CVE i powiększa warstwę `apk` do 133 MB), kopiujemy pojedynczą statyczną binarkę `/ffmpeg` z obrazu `mwader/static-ffmpeg:latest` (`ffmpeg 9.0.2`, 0 CVE w Docker Scout, serwowanego z Docker Hub bez throttlingu `johnvansickle.com`), aktualizujemy `musl` i `musl-utils` z repozytorium `alpine/edge/main` (`>= 1.2.6-r6`) oraz oczyszczamy etap `prod-deps` ze zbędnych w runtime kompilatorów SWC, pakietów testowych Playwright i map źródłowych (redukcja warstwy `node_modules` z 569 MB o ponad 70%).
