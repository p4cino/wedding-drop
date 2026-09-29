# Proposal

## Why

`apps/web/src/app/[locale]/owner/[slug]/page.tsx` ma 683 linie i jest monolitem („God component"), z którym trudno bezpiecznie pracować:

- Blok `headers["x-owner-token"] = ownerToken` + `try/catch console.error` + `res.ok` jest ręcznie skopiowany w 9 miejscach (linie ok. 83, 106, 267, 298, 328, 351, 381, 414, 443).
- Token jest wysyłany dwa razy: w nagłówku i w body `{ token: ownerToken }` (linie 305, 334, 358, 388, 419, 449), mimo że `authenticateOwner` (`apps/web/src/lib/auth.ts`) czyta nagłówek `x-owner-token` w pierwszej kolejności.
- Stan Google Drive to ok. 11 osobnych `useState` (`isGDriveConfigured`, `hasGDrive`, `gdriveEmail`, `gdriveStatus`, `gdriveProgress`, `gdriveFolderId`, `gdriveExportedAt`, modal, `includeHidden`, `exportLoading`, toast); te same settery są wołane w trzech miejscach (logowanie, SSE, polling) w trzech nieco różnych wariantach, a aktualizacje bywają nieatomowe (SSE ustawia status, progress i folderId osobno).
- `gdriveStatus` to gołe `string` (w `GDriveBackupCard.tsx` też), więc literówka w porównaniu nie jest wykrywana; `galleryInfo` ma typ `{ [key: string]: unknown }`.
- Puste `catch (_e) {}` w SSE/pollingu połykają błędy; `alert()` (np. linie 323, 376, 409, 455, 465) łamie spójność z istniejącym toastem; toast nazywa się `gdriveToast`, a obsługuje wszystkie komunikaty.
- `GDriveBackupCard.tsx:293,325` używa zbędnego `gdriveExportedAt!`.

## What Changes

- Hook `useOwnerApi(slug, ownerToken)` (`apps/web/src/hooks/useOwnerApi.ts`): `request(method, path, body?)` sam dokłada nagłówek, obsługuje `res.ok` i zwraca typowany wynik. Zbędne pole `token` w body jest usuwane po stronie klienta (serwer zachowuje fallback dla zgodności).
- Hook `useGDriveExport(slug, api)`: jeden obiekt `GDriveState` z funkcją `applyServerState(partial)`, SSE `gdrive-progress` (przez `useGalleryEvents` z `extract-live-gallery-hook`), polling co 3 s, `connect`/`disconnect`/`startExport`. Stan modala eksportu (`isOpen`, `includeHidden`, `loading`) przechodzi lokalnie do `GDriveExportModal`/hooka.
- Status Google Drive jako unia `"idle" | "running" | "completed" | "failed" | "interrupted"` (wspólny typ w `lib/`), w tym `GDriveBackupCard` (mapa `status → {ikona, kolory}` zamiast 4 gałęzi i `!`).
- Typowany kontrakt odpowiedzi logowania `OwnerAuthResponse` w `lib/owner-types.ts` współdzielony z trasą `POST /api/owner/[slug]/auth`.
- Komponenty: `OwnerLoginForm`, `OwnerHeader` (trzy niemal identyczne `Link`), ogólny `Toast` (zastępuje `gdriveToast` i większość `alert()`).
- `page.tsx` docelowo ≤ ok. 250 linii.

## Capabilities

### New Capabilities

- `owner-panel-structure`: spójna, typowana warstwa komunikacji i stanu panelu właściciela; błędy operacji widoczne dla użytkownika.

### Modified Capabilities

(brak zmian funkcjonalnych poza widocznością błędów zamiast pustych `catch`)

## Impact

- `apps/web/src/app/[locale]/owner/[slug]/page.tsx`, `components/owner/*`, nowe `hooks/`, `lib/owner-types.ts`, drobna zmiana typów w trasie `auth`.
- Bez zmian schematu bazy. Autoryzacja serwera (HMAC, `timingSafeEqual`) nietknięta.
- N100: bez wpływu; polling GDrive pozostaje co 3 s tylko w trakcie eksportu.

## Non-goals / Poza zakresem

- Zmiany przechowywania sesji (hasło w `sessionStorage`) — osobna zmiana `owner-session-token-only`; można wykonać przed tą lub po niej.
- Zastępowanie `confirm()` własnym dialogiem potwierdzenia.
- Zmiany API Google Drive po stronie serwera.
