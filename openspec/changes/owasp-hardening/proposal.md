# Proposal

## Why

Audyt OWASP Top 10 (2026-10-04) wykazał luki w obecnym kodzie: zapis pliku poza `data/` przy uploadzie brandingu (path traversal), możliwość wykonania skryptu z wgranego SVG na originie aplikacji, brak rate-limitingu na logowaniach i endpointach z bcrypt, hasła/PIN-y w plaintext, niespójne egzekwowanie hasła gościa oraz anonimowy upload bez limitu rozmiaru. Wszystkie dotyczą publicznie dostępnej aplikacji uruchamianej na małym N100, więc naprawa jest potrzebna przed kolejnym weselem.

## What Changes

Numeracja odpowiada raportowi z audytu (pkt 4 – sekrety/fallbacki – jest świadomie poza zakresem).

1. **Branding (pkt 1, 2):** rozszerzenie pliku wyznaczane z whitelisty na podstawie wykrytych magic bytes (nigdy z nazwy klienta), `fullPath` weryfikowany przez `path.resolve` względem katalogu brandingu, **SVG usunięte** z dozwolonych typów. Handler `/branding-file/*` dodaje `X-Content-Type-Options: nosniff` oraz restrykcyjne `Content-Security-Policy`.
2. **Hasło gościa i PIN hashowane (pkt 5):** bcrypt zamiast plaintext, lazy-upgrade istniejących wartości przy pierwszym poprawnym logowaniu (bez migracji danych). PIN tylko w nagłówku `x-access-pin` (koniec `?pin=`).
3. **Spójne egzekwowanie hasła gościa (pkt 6):** `GET /api/gallery/[slug]/media`, `/wishes` (GET i POST), `/live`, `/zip` oraz upload TUS gościa wymagają sesji gościa, gdy galeria ma `guestPassword`. `POST /wishes` respektuje `isActive`/`allowGuestUploads`. Metadane `GET /api/gallery/[slug]` nadal publiczne w minimalnym zakresie potrzebnym do ekranu logowania.
4. **Poświadczenia tylko w nagłówkach (pkt 7):** `/wishes` przestaje czytać `ownerToken`, `password`, `adminToken` z query (zgodnie z istniejącym specem `credential-transport`).
5. **Cykl życia tokenów (pkt 8):** tokeny dostają `jti`, krótszy TTL admina (8 h), endpointy wylogowania unieważniają token (in-memory deny-list do czasu wygaśnięcia); jednolity komunikat błędu logowania admina (bez enumeracji).
6. **Limity uploadu (pkt 9):** TUS `maxSize` = **1 GiB na plik** (guest i fotograf); `maxStorageBytes` egzekwowany także dla uploadów gości; osierocone uploady w `tus_temp` sprzątane po 24 h.
7. **Rate limiting (pkt 3):** in-memory limiter (okno przesuwne) per IP+slug na logowaniach (admin/owner/guest), PIN ZIP, `x-owner-password`/`x-admin-token` oraz POST `/wishes` i tworzenie uploadów TUS. Odpowiedź 429 z `Retry-After`.

**BREAKING:** SVG nie jest już przyjmowany jako logo/tło; `?pin=` w ZIP przestaje działać; istniejące sesje admina starsze niż 8 h oraz tokeny w starym formacie (bez `jti`) przestają być ważne (ponowne logowanie).

## Capabilities

### New Capabilities
- `rate-limiting`: limity prób dla endpointów uwierzytelniających i kosztownych, odpowiedzi 429.
- `guest-access-control`: spójne wymaganie sesji gościa dla galerii chronionej hasłem (API, SSE, TUS).
- `credential-storage`: hasła gościa i PIN-y przechowywane jako hash bcrypt, lazy-upgrade, stałoczasowe porównania.
- `token-lifecycle`: `jti`, TTL, unieważnianie tokenów przy wylogowaniu, jednolite błędy logowania.
- `upload-limits`: maksymalny rozmiar pliku 1 GiB, limit pojemności galerii dla gości, sprzątanie osieroconych uploadów.

### Modified Capabilities
- `gallery/custom-branding`: dozwolone tylko JPEG/PNG/WebP z weryfikacją magic bytes, bezpieczna nazwa pliku, nagłówki serwowania.
- `credential-transport`: scenariusze dla `/wishes` (query ignorowane), PIN wyłącznie w nagłówku.

## Impact

- Kod: `apps/web/src/app/api/owner/[slug]/branding/route.ts`, `apps/web/src/lib/branding-file-handler.ts`, `apps/web/src/lib/auth.ts`, trasy `api/gallery/[slug]/{auth,media,wishes,live,zip}`, `api/admin/auth`, `api/owner/[slug]/{auth,settings,session}`, `packages/media/src/tus-server.ts`, nowy `apps/web/src/lib/rate-limit.ts`.
- Baza: brak zmiany schematu (kolumny `guest_password`/`access_pin` to `text`; hash mieści się w tekście).
- N100: limiter in-memory (Map z sprzątaniem, bez zależności), bcrypt tylko po przejściu limitu; `p-queue` (2), watchdog FFmpeg 25 s, streaming ZIP i `path.resolve` bez zmian. Sprzątanie `tus_temp` to lekki timer.
- Docs: `README.md`, `DOCUMENTATION.md` (limity, rate-limiting, brak SVG).

## Non-goals / Poza zakresem

- Pkt 4 audytu: wymuszenie `ADMIN_SECRET`/`ADMIN_PASSWORD`, usunięcie hardcoded fallbacków i domyślnych haseł w compose.
- Nagłówki CSP/HSTS globalnie w Caddy, logi audytowe, WAF.
- Rate limiting rozproszony (jedna instancja Node; limiter resetuje się po restarcie).
- Przeniesienie tokenu admina do ciasteczka httpOnly.
