# Tasks

## 1. Branding (pkt 1, 2)

- [x] 1.1 Dodać `detectImageType` (magic bytes JPEG/PNG/WebP) w `apps/web/src/lib` wraz z testami Vitest (poprawne, fałszywy MIME, HTML, SVG)
- [x] 1.2 Przepisać `POST /api/owner/[slug]/branding`: usunąć SVG z dozwolonych, nazwa/rozszerzenie z whitelisty, weryfikacja `path.resolve(fullPath)` w katalogu brandingu, usunięcie poprzedniego pliku przy zmianie formatu
- [x] 1.3 Przepisać `DELETE` tak, by rozszerzenie nie pochodziło z wartości w DB bez walidacji whitelisty
- [x] 1.4 Dodać `nosniff` i `Content-Security-Policy: default-src 'none'; sandbox` w `branding-file-handler.ts`; poprawić sprawdzenie `startsWith(dir + path.sep)`
- [x] 1.5 Testy: traversal w nazwie pliku (`a.b/../../../x`), SVG → 400, nagłówki odpowiedzi
- [x] 1.6 Zaktualizować UI `GalleryBrandingPanel` (accept bez SVG, komunikat błędu PL)

## 2. Rate limiting (pkt 3)

- [x] 2.1 Zaimplementować `apps/web/src/lib/rate-limit.ts` (okno, limit kluczy, sprzątanie `unref`, `getClientIp`) + testy jednostkowe z fake timers
- [x] 2.2 Podpiąć do `admin/auth`, `owner/[slug]/auth`, `gallery/[slug]/auth` (limit porażek, reset po sukcesie, 429 + `Retry-After`)
- [x] 2.3 Podpiąć do ścieżek z `x-owner-password` (token admina to tani HMAC, bez limitu) (`media`, `wishes`, `live`, `zip`, `auth/google`) – limit porażek przed bcrypt
- [x] 2.4 Podpiąć do PIN-u ZIP, `POST /wishes` oraz `onUploadCreate` w TUS (callback/IP z `req`)
- [x] 2.5 Wyciągnąć wspólny helper „może widzieć ukryte” z powielonych bloków i użyć w czterech trasach
- [x] 2.6 Testy tras: 429 po przekroczeniu, brak wywołania bcrypt, niezależność per slug

## 3. Przechowywanie poświadczeń (pkt 5)

- [x] 3.1 Dodać moduł `credential.ts` (`hashSecret`, `verifySecret` z lazy-upgrade) + testy (hash, plaintext legacy, błędne hasło)
- [x] 3.2 `PATCH owner/[slug]/settings` i `POST admin/galleries`: zapis hashy hasła gościa i PIN-u
- [x] 3.3 `gallery/[slug]/auth`, `media-file-handler` (nie wymaga weryfikacji hasła — tylko token), `zip`: użyć `verifySecret`, upgrade po sukcesie
- [x] 3.4 ZIP: PIN wyłącznie z nagłówka `x-access-pin`, usunąć `?pin=`; zaktualizować klienta
- [x] 3.5 Upewnić się grepem, że żadna odpowiedź API/UI nie zwraca `guestPassword`/`accessPin` (tylko flagi `hasPassword`/`hasPin`)

## 4. Kontrola dostępu gościa (pkt 6)

- [x] 4.1 Dodać `requireGuestAccess` w `auth.ts` + testy (bez hasła, z ciasteczkiem, owner, admin, zły token)
- [x] 4.2 Użyć w `GET /media`, `GET/POST /wishes`, `GET /live`; `POST /wishes` respektuje `allowGuestUploads`
- [x] 4.3 Zredukować publiczne `GET /api/gallery/[slug]` dla galerii z hasłem (`hasPassword`, bez `id` i `cardSettings`); sprawdzić zależności klienta
- [x] 4.4 TUS: wstrzykiwany `verifyGuestAccess(slug, cookieHeader)` w `initTusServer`, 401 dla gościa bez sesji
- [x] 4.5 Klient: weryfikacja obsługi 401 – bez zmian w kodzie, bo layout `g/[slug]` już wymaga ciasteczka gościa po stronie serwera i pokazuje `GuestLoginForm` przed renderem klienckich hooków
- [ ] 4.6 Test E2E (Playwright): galeria z hasłem – napisany (`e2e/guest-password-access.spec.ts`, poziom API), NIE uruchomiony: wymaga pełnego stacku Docker (`https://localhost`)

## 5. Poświadczenia z query (pkt 7)

- [x] 5.1 Usunąć odczyt `ownerToken`/`password`/`adminToken` z query w `/wishes`; test 401 dla obu scenariuszy z specu
- [x] 5.2 Sprawdzić grepem pozostałe trasy i klientów pod kątem tokenów w URL

## 6. Cykl życia tokenów (pkt 8)

- [x] 6.1 Nowy format tokenów z `jti` w `generate*/verify*Token`; admin TTL 8 h; testy (stary format odrzucony, wygasły, zmanipulowany, timingSafeEqual)
- [x] 6.2 Deny-list `jti` w pamięci + `revokeToken` ze sprzątaniem; weryfikacja w `verify*` (obejmuje `/media-file` i TUS)
- [x] 6.3 `POST /api/admin/auth/logout` + wywołanie z panelu admina; `DELETE owner/[slug]/session` unieważnia token (nagłówek lub ciasteczko)
- [x] 6.4 Jednolity komunikat i wyrównanie czasu w `admin/auth` (fikcyjny `compare`); testy
- [x] 6.5 Zaktualizować `useAdminApi`/`useOwnerApi` pod ponowne logowanie po 401

## 7. Limity uploadu (pkt 9)

- [x] 7.1 Ustawić `maxSize` = 1 GiB w `initTusServer`; wymusić `Upload-Length`; testy 413 (1 GiB + 1) i akceptacja 1 GiB
- [x] 7.2 Uogólnić `checkPhotographerStorageLimit` na uploady gości (limit > 0); testy
- [x] 7.3 Sprzątanie `tus_temp` starszych niż 24 h (timer `unref`, uruchamiany z `initTusServer`); testy z fake timers
- [x] 7.4 Komunikaty 413 PL i obsługa w `tus-upload.ts`/`useUploadQueue` (wyraźny błąd „plik większy niż 1 GB”)

## 8. Dokumentacja i weryfikacja

- [x] 8.1 Zaktualizować `README.md` i `DOCUMENTATION.md` (limity, rate limiting, brak SVG, 8 h sesja admina, PIN w nagłówku, wylogowanie)
- [x] 8.2 `pnpm lint`, `pnpm test`, `pnpm test:coverage` + `node scripts/check-coverage.js`, `pnpm build`
- [ ] 8.3 `pnpm test:e2e` dla ścieżek gościa i właściciela (nie uruchomiono – brak stacku Docker); `openspec validate owasp-hardening` ✓ (poprawiono też oczekiwany tekst błędu w `admin-management.spec.ts`)
