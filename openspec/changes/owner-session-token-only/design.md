# Design

## Context

`POST /api/owner/[slug]/auth` sprawdza hasło (`bcrypt.compare`), wystawia `generateOwnerToken(slug)` i zwraca dane panelu. Klient trzyma token i hasło w `sessionStorage`, a po odświeżeniu wywołuje `doLogin(savedPwd)`. Token HMAC-SHA256 jest ważny 7 dni i jest już akceptowany przez wszystkie trasy właściciela przez `authenticateOwner`.

## Goals / Non-Goals

**Goals:**
- Usunąć hasło z magazynu przeglądarki bez pogorszenia UX odświeżania.
- Nie dublować kształtu ładunku między logowaniem a odtwarzaniem sesji.

**Non-Goals:**
- Zmiana modelu tokenów, cookies HttpOnly, odnawianie tokenu.

## Decisions

- **Nowa trasa `GET /api/owner/[slug]/session`:** używa `authenticateOwner(req, slug)` (zwraca `gallery` przy sukcesie), następnie doładowuje statystyki, winietkę i rekord GDrive i buduje ładunek przez `buildOwnerPanelPayload`. Odpowiedź bez `ownerToken`. `export const dynamic = "force-dynamic"`.
- **`buildOwnerPanelPayload` w `apps/web/src/lib/owner-panel-payload.ts`** — przenosi zapytania i mapowanie z trasy `auth`; trasa `auth` po weryfikacji hasła woła to samo i dodaje `ownerToken`. Zapytania o `mediaItems`/`cardSettings` bez zmian (indeksy `media_items` nietknięte).
- **Klient:** inicjalizacja: jeśli w `sessionStorage` jest token → `GET /session` z nagłówkiem; `401` → czyść token; w przeciwnym razie formularz. Po loginie zapisujemy wyłącznie token.
- **Migracja:** `sessionStorage.removeItem("owner_pwd_" + slug)` przy każdym starcie panelu (tania, idempotentna operacja).
- **Kompatybilność z `refactor-owner-panel-state`:** endpoint zwraca typ `OwnerAuthResponse` bez pola `ownerToken` (`Omit<OwnerAuthResponse, "ownerToken">`).
- **Prywatność mediów:** trasa nie zwraca list mediów ani życzeń, tylko agregaty i konfigurację, więc nie zmienia reguł widoczności `hidden`/`deleted`.

## Risks / Trade-offs

- [Ryzyko: po wygaśnięciu tokenu (7 dni) właściciel musi się zalogować ponownie] → Mitigacja: sessionStorage jest per-karta i i tak znika po zamknięciu karty; zachowanie jest akceptowalne i jawne (komunikat sesji wygasła).
- [Ryzyko: rozjazd ładunków logowania i sesji] → Mitigacja: wspólna funkcja i wspólny typ, test kontraktowy porównujący klucze.
- [Ryzyko: ujawnienie danych bez tokenu] → Mitigacja: testy 401/404 oraz token innego slugu.
