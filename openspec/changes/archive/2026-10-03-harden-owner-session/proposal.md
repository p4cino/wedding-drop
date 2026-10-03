# Proposal

## Why

Panel Pary Młodej przechowuje jawne hasło właściciela w `sessionStorage` (auto-logowanie po odświeżeniu), a token właściciela trafia do adresów URL (link ZIP, przekierowanie do Google OAuth), skąd wycieka do historii przeglądarki, logów Caddy/proxy i nagłówka `Referer`. Dodatkowo endpoint ZIP w ogóle nie rozpoznaje tokenu właściciela — przycisk „Pobierz ZIP” w panelu działa jak pobranie gościa (bez plików ukrytych, a przy wyłączonych pobieraniach gości kończy się `403`).

## What Changes

- Logowanie właściciela (`POST /api/owner/[slug]/auth`) dodatkowo ustawia ciasteczko sesji `HttpOnly; SameSite=Strict; Path=/api` (z `Secure` w produkcji) z podpisanym tokenem HMAC, ważne 7 dni.
- Nowy endpoint `GET /api/owner/[slug]/session` przywraca sesję z ciasteczka (dane galerii, statystyki, świeży `ownerToken` w JSON) oraz `DELETE /api/owner/[slug]/session` do wylogowania (czyści ciasteczko).
- Panel właściciela przestaje zapisywać hasło i token w `sessionStorage`; po odświeżeniu odtwarza sesję przez `GET /session`, token trzyma wyłącznie w pamięci.
- `GET /api/gallery/[slug]/zip` rozpoznaje właściciela po ciasteczku sesji lub nagłówku `x-owner-token`; link „Pobierz ZIP” nie zawiera już żadnego tokenu.
- **BREAKING**: `GET /api/auth/google?slug=&token=|password=` zastąpione przez `POST /api/auth/google` (autoryzacja nagłówkiem/ciasteczkiem, slug w body), zwracające `{ authUrl }`; klient sam nawiguje do Google.
- **BREAKING**: serwer przestaje akceptować poświadczenia w query stringu: `?password=`, `?token=`, `?ownerToken=`, `?adminToken=` (endpointy `media`, `zip`, `auth/google`, `admin/galleries`, `authenticateOwner`).
- Mutujące endpointy właściciela (PATCH/DELETE/POST) nadal wymagają nagłówka `x-owner-token` (lub tokenu w body) — ciasteczko jest honorowane tylko dla metod bezpiecznych (GET/HEAD), co zamyka wektor CSRF.
- Aktualizacja `README.md` i `DOCUMENTATION.md` (sekcje API i bezpieczeństwa).

## Capabilities

### New Capabilities
- `owner-session`: uwierzytelnianie Pary Młodej — logowanie hasłem, sesja w ciasteczku HttpOnly, przywracanie i zamykanie sesji, zakres honorowania ciasteczka, inicjowanie łączenia z Google Drive oraz pobieranie ZIP przez właściciela.
- `credential-transport`: zasady przekazywania poświadczeń (hasła, tokeny właściciela i administratora) do API — wyłącznie nagłówki, body JSON lub ciasteczko sesji; nigdy query string ani trwała pamięć przeglądarki.

### Modified Capabilities
<!-- Brak — katalog openspec/specs/ nie zawiera jeszcze żadnych specyfikacji. -->

## Impact

- **API**: `apps/web/src/app/api/owner/[slug]/auth/route.ts`, nowy `apps/web/src/app/api/owner/[slug]/session/route.ts`, `api/gallery/[slug]/zip/route.ts`, `api/gallery/[slug]/media/route.ts`, `api/auth/google/route.ts`, `api/admin/galleries/route.ts`, `api/admin/galleries/[id]/route.ts`.
- **Biblioteka auth**: `apps/web/src/lib/auth.ts` (`authenticateOwner`, nowe helpery ciasteczka sesji).
- **Frontend**: `apps/web/src/app/[locale]/owner/[slug]/page.tsx` (usunięcie `sessionStorage`, nowy przepływ przywracania sesji, link ZIP, łączenie Google Drive).
- **Testy**: `tests/integration/api/gallery.test.ts`, `google-auth.test.ts`, `rest-endpoints.test.ts`, `e2e/owner-moderation.spec.ts` (obecnie używają `?password=` / `?token=` / `?adminToken=`).
- **Dokumentacja**: `DOCUMENTATION.md` (linie ~176 i ~187 opisują `?password=`), `README.md`.
- **Klienci zewnętrzni**: skrypty korzystające z `?password=` muszą przejść na nagłówek `x-owner-password` lub `x-owner-token`.
- Brak nowych zależności; brak zmian w schemacie DB i w pipeline mediów.
