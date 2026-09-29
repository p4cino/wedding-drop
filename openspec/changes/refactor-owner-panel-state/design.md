# Design

## Context

Panel łączy: logowanie/odtwarzanie sesji, listy mediów i życzeń z moderacją, statystyki, kartę Google Drive z eksportem, SSE i polling, toast. Wszystko w jednym komponencie z ok. 11 stanami tylko dla Google Drive. Serwer już akceptuje token w nagłówku, w `Authorization: Bearer`, w query i w body (`authenticateOwner`).

## Goals / Non-Goals

**Goals:**
- Usunąć duplikację warstwy fetch/auth i stanu GDrive.
- Uczynić stan GDrive atomowym i typowanym.

**Non-Goals:**
- Zmiana modelu sesji (osobna zmiana), zmiana UI, nowe funkcje.

## Decisions

- **`useOwnerApi`:** `request<T>(method, path, body?)` → `{ ok, status, data }`. Nagłówek `x-owner-token` dokładany zawsze, gdy token istnieje. Błędy sieci mapowane na wynik, nie wyjątek, żeby wywołujący pokazał toast. Serwer nadal przyjmuje `body.token` (kompatybilność wsteczna), ale klient go nie wysyła.
- **`useGDriveExport`:** `useReducer` z akcjami `server-state` (częściowa aktualizacja scalana atomowo), `open-modal`/`close-modal`, `set-include-hidden`. Źródła: odpowiedź logowania, SSE `gdrive-progress`, polling; wszystkie przechodzą przez `applyServerState`. SSE zapewnia `useGalleryEvents` (z `extract-live-gallery-hook`); do czasu jej wdrożenia hook tworzy `EventSource` lokalnie i zostaje przełączony w tej zmianie.
- **Typy:** `GDriveExportStatus` w `lib/owner-types.ts`; trasa `auth` zwraca `OwnerAuthResponse` (ten sam typ importuje klient) — znika `data.gallery?.x || null`.
- **`GDriveBackupCard`:** dostaje obiekt `state` zamiast 6 propsów; mapa `STATUS_VIEW: Record<GDriveExportStatus, {icon, tone}>`; `!` zastąpione zawężeniem typu.
- **Toast:** `components/Toast.tsx` (`role="status"`/`alert` wg typu) zastępuje `gdriveToast` i `alert()`; `confirm()` zostaje.
- **Prywatność:** brak zmian tras publicznych; widok właściciela nadal używa `includeHidden` z tokenem, publiczne endpointy gościa bez zmian.

## Risks / Trade-offs

- [Ryzyko: regresja w krytycznym przepływie logowania/eksportu] → Mitigacja: istniejące testy `GDriveBackupCard`, `GDriveExportModal`, `MediaGridWithModeration` i e2e `owner-moderation` zostają; dopisujemy testy hooków (`useOwnerApi`, reducer GDrive).
- [Ryzyko: konflikt kolejności z `owner-session-token-only`] → Mitigacja: obie zmiany dotykają logiki logowania; wdrażać kolejno (najpierw sesja, potem ta zmiana) albo rebasować po pierwszej.
