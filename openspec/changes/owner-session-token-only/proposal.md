# Proposal

## Why

Panel właściciela zapisuje w `sessionStorage` **hasło właściciela w postaci jawnej** (`owner_pwd_${slug}`, `owner/[slug]/page.tsx` linie ok. 156, 218) obok tokenu HMAC (`owner_token_${slug}`) i używa go do cichego ponownego logowania przy odświeżeniu strony. Skutek: dowolny XSS w origin aplikacji ujawnia hasło (które właściciel może reużywać), a nie tylko krótkotrwały token. Token jest podpisany HMAC-SHA256 i ważny 7 dni (`verifyOwnerToken`), więc do odtworzenia sesji hasło nie jest potrzebne — brakuje jedynie lekkiego endpointu zwracającego dane panelu na podstawie tokenu (dziś dane galerii, statystyki i stan Google Drive zwraca wyłącznie `POST /api/owner/[slug]/auth` po podaniu hasła).

## What Changes

- Nowy endpoint `GET /api/owner/[slug]/session` autoryzowany tokenem (`authenticateOwner`, nagłówek `x-owner-token`), zwracający ten sam ładunek co logowanie **bez** nowego tokenu (galeria, statystyki, winietka, `isGDriveConfigured`).
- Wspólna funkcja `buildOwnerPanelPayload(gallery, gdrive)` używana przez `POST .../auth` i `GET .../session`, żeby oba kształty nie mogły się rozjechać.
- Klient przestaje zapisywać hasło; przy starcie odtwarza sesję tokenem z `sessionStorage`. Odpowiedź 401 czyści token i pokazuje formularz logowania.
- Migracja: przy ładowaniu panelu usuwamy stary klucz `owner_pwd_${slug}` z `sessionStorage`, jeśli istnieje (sprzątanie po poprzedniej wersji).
- Aktualizacja DOCUMENTATION.md (opis sesji właściciela i nowego endpointu).

## Capabilities

### New Capabilities

- `owner-session-security`: sesja panelu właściciela opiera się wyłącznie na podpisanym, wygasającym tokenie; hasło nie jest przechowywane po stronie przeglądarki.

### Modified Capabilities

(brak — logowanie hasłem działa jak dotąd)

## Impact

- `apps/web/src/app/api/owner/[slug]/auth/route.ts` (wydzielenie payloadu), nowa trasa `session/route.ts`, `owner/[slug]/page.tsx`, testy integracyjne tras owner, e2e `owner-moderation`.
- Bezpieczeństwo: brak nowych sekretów; weryfikacja tokenu przez istniejące `verifyOwnerToken` (`crypto.timingSafeEqual`). Nowa trasa nie ujawnia niczego, czego nie zwraca dziś logowanie; brak dostępu bez tokenu (401), nieistniejąca galeria (404).
- N100: jedno dodatkowe zapytanie przy odświeżeniu panelu, taki sam koszt jak dzisiejsze ponowne logowanie, ale bez `bcrypt.compare` (tańsze niż dziś).

## Non-goals / Poza zakresem

- Brak cookies HttpOnly ani wydłużania/odnawiania ważności tokenu (7 dni pozostaje).
- Brak zmian w logowaniu administratora.
- Brak wylogowania po stronie serwera (unieważniania tokenów) — poza zakresem tej iteracji.
