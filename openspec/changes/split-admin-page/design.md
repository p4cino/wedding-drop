# Design

## Context

`admin/page.tsx` trzyma `token`, `username`, `password`, `error`, `loading`, `galleries`, `isModalOpen`, pięć pól formularza i `createdGallery` jako oddzielne `useState`. `owner/[slug]/page.tsx` ma już wydzielone `components/owner/*`, admin nie.

## Goals / Non-Goals

**Goals:**
- Komponenty ≤ ok. 150 linii, jedna warstwa API, widoczne błędy.

**Non-Goals:**
- Zmiana wyglądu, trwały token, nowe funkcje.

## Decisions

- **`useAdminApi(token, onUnauthorized)`** zwraca `request(method, path, body?)`; 401 wywołuje `onUnauthorized` (czyszczenie tokenu + komunikat). Błędy sieci i `!ok` zwracane jako wynik, a nie połykane.
- **Formularz tworzenia jako `useReducer`** (`field`/`reset`), reset jedną akcją; `createdGallery` (widok „sukces" z linkami) pozostaje stanem modala.
- **Linki:** `const GALLERY_LINKS = [{ href, labelKey, icon, tone }, …]` mapowane w wierszu i w modalu; wspólny komponent `NewTabLinkLabel` dodaje sr-only „(otwiera się w nowej karcie)" z klucza i18n.
- **Formatowanie MB** przez `formatMegabytes` z `shared-ui-primitives-and-utils` (do tego czasu lokalne).
- **Prywatność:** zmiana wyłącznie po stronie klienta panelu; brak wpływu na endpointy gościa i widoczność `hidden`/`deleted`.

## Risks / Trade-offs

- [Ryzyko: regresja w kluczowym przepływie tworzenia galerii] → Mitigacja: e2e `admin-management` musi przechodzić bez zmian; dopisujemy testy komponentów (401, błąd tworzenia, błąd usuwania).
- [Ryzyko: nakładanie się z `localize-hardcoded-ui-strings`] → Mitigacja: klucze i18n dla nowych komunikatów dodajemy w tej zmianie; pozostałe teksty admina w zmianie lokalizacyjnej — kolejność dowolna, konflikty tylko w plikach `messages/*.json`.
