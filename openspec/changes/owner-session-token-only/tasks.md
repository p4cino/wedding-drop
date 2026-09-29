# Tasks

## 1. Backend

- [x] 1.1 Wydziel `buildOwnerPanelPayload` do `apps/web/src/lib/owner-panel-payload.ts` z trasy `POST /api/owner/[slug]/auth` (bez zmiany odpowiedzi logowania); zweryfikuj istniejące testy integracyjne trasy `auth`
- [x] 1.2 Dodaj `apps/web/src/app/api/owner/[slug]/session/route.ts` (`authenticateOwner`, brak `ownerToken` w odpowiedzi, 401/404) i testy integracyjne: ważny token, brak tokenu, token innej galerii, nieistniejąca galeria, zgodność kluczy z odpowiedzią logowania

## 2. Klient

- [x] 2.1 Usuń zapis i odczyt `owner_pwd_${slug}` z `owner/[slug]/page.tsx`, dodaj sprzątanie starego klucza i odtwarzanie sesji przez `GET /session` (401 → czyszczenie tokenu i formularz logowania)
- [ ] 2.2 Uprość efekt inicjalizacji (usuń `hasInitialized` i `typeof window` w efekcie, wydziel parsowanie `?gdrive=` do małego helpera)
- [ ] 2.3 Zweryfikuj testem/e2e: po logowaniu w `sessionStorage` brak hasła, odświeżenie strony zachowuje sesję, stary klucz jest usuwany

## 3. Dokumentacja i weryfikacja

- [x] 3.1 Dodaj endpoint do DOCUMENTATION.md (sekcja API panelu Pary Młodej) oraz opis modelu sesji w README.md
- [x] 3.2 `pnpm lint`, `check-types`, `pnpm test:coverage` + `node scripts/check-coverage.js`, e2e `owner-moderation`
