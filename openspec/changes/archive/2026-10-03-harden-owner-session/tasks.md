# Tasks

## 1. Helpery ciasteczka sesji i ekstrakcji poświadczeń (`lib/auth.ts`)

- [x] 1.1 Dodać w `apps/web/src/lib/auth.ts` stałe i helpery: `ownerSessionCookieName(slug)` → `wd_owner_{slug}`, `setOwnerSessionCookie(res, slug, token)` (HttpOnly, SameSite=Strict, Path=/api, Max-Age=604800, Secure gdy `NODE_ENV === "production"`) oraz `clearOwnerSessionCookie(res, slug)` (Max-Age=0); weryfikacja: nowe testy w `tests/unit/auth.test.ts` sprawdzają nazwę i atrybuty ciasteczka w obu trybach `NODE_ENV`
- [x] 1.2 Dodać helper `readOwnerToken(req, slug, body?)` zwracający token z `x-owner-token` → `Authorization: Bearer` → `body.token` → ciasteczko `wd_owner_{slug}` (tylko dla `GET`/`HEAD`), bez żadnego odczytu `searchParams`; weryfikacja: testy jednostkowe pokrywają każdy kanał, ignorowanie `?token=` oraz ignorowanie ciasteczka dla `DELETE`/`PATCH`/`POST`
- [x] 1.3 Przepiąć `authenticateOwner` na `readOwnerToken` (usunięcie `?token=`); weryfikacja: w `tests/integration/api/rest-endpoints.test.ts` nowe przypadki — `?token=` daje 401, `DELETE /api/owner/{slug}/media/{id}` z samym ciasteczkiem daje 401, z nagłówkiem 200; dotychczasowe testy z `x-owner-token` przechodzą (`pnpm --filter @wedding-drop/web test`)

## 2. Sesja właściciela: logowanie, przywracanie, wylogowanie

- [x] 2.1 Wydzielić budowanie payloadu sesji (galeria + gdrive + stats + cardSettings + isGDriveConfigured) z `api/owner/[slug]/auth/route.ts` do `apps/web/src/lib/owner-session.ts`; weryfikacja: istniejące testy `POST /auth` w `rest-endpoints.test.ts` przechodzą bez zmian asercji
- [x] 2.2 `POST /api/owner/[slug]/auth` ustawia ciasteczko sesji przy sukcesie, nie ustawia przy 401; weryfikacja: testy integracyjne asercją nagłówka `Set-Cookie` (atrybuty z 1.1) i jego braku przy błędnym haśle
- [x] 2.3 Utworzyć `apps/web/src/app/api/owner/[slug]/session/route.ts` z `GET` (weryfikacja ciasteczka, payload z 2.1 + świeży `ownerToken`, odnowienie ciasteczka) i `DELETE` (wygaszenie ciasteczka); weryfikacja: testy integracyjne — 200 z ważnym ciasteczkiem, 401 bez ciasteczka / z wygasłym / z podpisem innej galerii, `DELETE` zwraca `Set-Cookie` z `Max-Age=0`
- [x] 2.4 Udokumentować nowe endpointy `GET`/`DELETE /api/owner/{slug}/session` i ciasteczko `wd_owner_{slug}` w `DOCUMENTATION.md` (sekcja API właściciela) oraz w `README.md` (sekcja bezpieczeństwa); weryfikacja: opis zgodny z odpowiedziami z testów 2.2–2.3

## 3. ZIP i media: usunięcie poświadczeń z query, obsługa tokenu w ZIP

- [x] 3.1 `api/gallery/[slug]/zip/route.ts`: `isOwner` = ważny token z `readOwnerToken` (nagłówek lub ciasteczko) lub poprawne `x-owner-password`; usunąć `searchParams.get("password")`; streaming `archiver` bez zmian; weryfikacja: testy w `tests/integration/api/gallery.test.ts` — właściciel z ciasteczkiem przy `allowGuestDownloads=false` dostaje 200 z plikami ukrytymi, `?password=` jest obsługiwane jak gość
- [x] 3.2 `api/gallery/[slug]/media/route.ts`: usunąć `?ownerToken=`, `?password=`, `?adminToken=`; dodać akceptację `Authorization: Bearer` dla tokenu admina (zgodnie z `DOCUMENTATION.md`); weryfikacja: zaktualizowane testy `gallery.test.ts` (linie ~206 i ~220 przechodzą na nagłówki) oraz nowe przypadki 401 dla poświadczeń w query
- [x] 3.3 `api/admin/galleries/route.ts` i `api/admin/galleries/[id]/route.ts`: usunąć odczyt `?token=`; weryfikacja: test integracyjny `GET /api/admin/galleries?token=…` bez nagłówka zwraca 401, testy z `x-admin-token` przechodzą
- [x] 3.4 Zaktualizować `DOCUMENTATION.md` (linie ~176 i ~187: usunąć `?password=`, opisać nagłówki i ciasteczko) oraz dodać do `README.md` notkę o zmianie łamiącej z instrukcją migracji dla skryptów; weryfikacja: `rg "\?password=|adminToken=|\?token=" DOCUMENTATION.md README.md` nie zwraca opisu jako obsługiwanej metody

## 4. Inicjowanie Google OAuth przez POST

- [x] 4.1 Przepisać `api/auth/google/route.ts` na `POST` (body `{ slug }`, autoryzacja `x-owner-token`/`Authorization: Bearer` lub `x-owner-password`, odpowiedź `200 { authUrl }`), usunąć eksport `GET`; weryfikacja: `tests/integration/api/google-auth.test.ts` przepisane na `POST` — 200 z `authUrl` zawierającym `state`, 401 bez/z błędnymi poświadczeniami, 404 dla nieistniejącej galerii, 503 gdy Drive nieskonfigurowany
- [x] 4.2 Dodać test, że `GET /api/auth/google?slug=…&token=…` nie przekierowuje do Google (405 / brak eksportu `GET`); weryfikacja: test przechodzi
- [x] 4.3 Zaktualizować opis przepływu OAuth w `DOCUMENTATION.md` i w skillu `.agents/skills/wedding-gdrive/SKILL.md` (jeśli opisuje `GET /api/auth/google`); weryfikacja: dokumenty opisują `POST` i `authUrl`

## 5. Panel właściciela (frontend)

- [x] 5.1 W `apps/web/src/app/[locale]/owner/[slug]/page.tsx` usunąć wszystkie `sessionStorage.setItem/getItem` dla hasła i tokenu, dodać jednorazowe `removeItem` kluczy `owner_pwd_{slug}` i `owner_token_{slug}`, po zalogowaniu czyścić stan `password`; weryfikacja: `rg "sessionStorage|localStorage" apps/web/src` zwraca tylko linie `removeItem` migracji
- [x] 5.2 Wydzielić `applySession(data)` używane przez `doLogin` i nowy efekt montowania wywołujący `GET /api/owner/{slug}/session` (200 → widok zalogowany, 401 → formularz); zachować obsługę `?gdrive=connected` / `?gdrive_error`; weryfikacja: E2E w `e2e/owner-moderation.spec.ts` — po zalogowaniu `page.reload()` pokazuje panel bez formularza hasła, a `sessionStorage` nie zawiera hasła ani tokenu
- [x] 5.3 Link „Pobierz ZIP” zmienić na `href={`/api/gallery/${slug}/zip`}`; weryfikacja: E2E sprawdza, że `href` nie zawiera `token`/`password`, a pobranie zwraca archiwum z plikami ukrytymi
- [x] 5.4 `handleConnectGDrive` przepisać na `fetch("/api/auth/google", { method: "POST", headers: { "x-owner-token": ownerToken }, body: { slug } })` i `window.location.assign(authUrl)`; obsłużyć błąd toastem; weryfikacja: E2E przechwytuje żądanie (`page.route`) i sprawdza metodę `POST`, brak tokenu w URL oraz nawigację na zwrócony `authUrl`
- [x] 5.5 Dodać przycisk „Wyloguj” (`DELETE /api/owner/{slug}/session`, reset stanu) z kluczami i18n w `apps/web/messages/{pl,en,de}.json`; weryfikacja: E2E — po wylogowaniu i `reload()` widoczny formularz hasła; `pnpm biome check apps/ packages/` bez błędów
- [x] 5.6 Zaktualizować `e2e/owner-moderation.spec.ts` (linia ~60: `?password=` → nagłówek `x-owner-password` lub ciasteczko z kontekstu) oraz dodać scenariusz wejścia na `/owner/{slug}?gdrive=connected` z istniejącą sesją (sesja odtworzona mimo nawigacji spoza witryny); weryfikacja: `pnpm test:e2e` przechodzi na projektach chromium, Mobile Chrome i Mobile Safari

## 6. Weryfikacja integracyjna

- [x] 6.1 Uruchomić pełny zestaw: `pnpm biome check apps/ packages/`, `pnpm check-types` (turbo), `pnpm test`, `pnpm test:e2e`; weryfikacja: wszystkie przechodzą
- [x] 6.2 Przegląd końcowy: `rg "searchParams\.get\(\"(password|token|ownerToken|adminToken)\"\)" apps/web/src` zwraca 0 wyników, a `rg "token=|password=" apps/web/src` nie znajduje poświadczeń w generowanych URL-ach; weryfikacja: wyniki odnotowane w opisie PR
- [x] 6.3 `pnpm openspec validate harden-owner-session --strict`; weryfikacja: walidacja bez błędów
