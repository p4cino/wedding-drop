# Proposal

## Why

`apps/web/src/app/[locale]/admin/page.tsx` (671 linii) miesza w jednym komponencie pięć odpowiedzialności: logowanie, statystyki, tabelę galerii, modal tworzenia galerii i wszystkie wywołania API. Przy dodaniu kolejnej funkcji plik zbliży się do progu 1000 linii. Oprócz struktury są tu realne wady:

- `loadGalleries` ignoruje `!res.ok` — po wygaśnięciu tokenu administratora (401) tabela wygląda na **pustą**, jakby nie było żadnych wesel; `handleDelete` również nie zgłasza błędu.
- Błędy są pokazywane przez `alert()` z twardym polskim tekstem (linie ok. 131, 157, 160), choć komponent ma już `useTranslations` i formularz logowania z komunikatem inline.
- Formularz tworzenia to 5 osobnych `useState` + ręczne resetowanie po sukcesie; nagłówek `x-admin-token` jest składany w wielu miejscach.
- Trzy niemal identyczne `<Link>` w wierszu tabeli (ok. 409-447) i trzy w modalu (ok. 512-555), każdy z sr-only „(otwiera się w nowej karcie)".
- Modal ma `role="dialog" aria-modal`, ale nie ma pułapki fokusu ani przywracania fokusu.

## What Changes

- Rozbicie strony na `components/admin/`: `AdminLoginForm`, `AdminStats`, `GalleryTable` (z `GalleryRow`), `CreateGalleryModal` (własny stan formularza jako `useReducer`, własny Escape).
- Hook `useAdminApi(token)` z jednolitym nagłówkiem `x-admin-token`, obsługą `res.ok` i rozpoznaniem 401 (powrót do ekranu logowania z komunikatem „sesja wygasła").
- Tablica konfiguracyjna linków `{ href, labelKey, icon, tone }` zamiast 6 skopiowanych `<Link>`.
- Błędy tworzenia/usuwania jako komunikaty inline (istniejący wzorzec z logowania) zamiast `alert()`; teksty przez i18n (szczegóły kluczy w `localize-hardcoded-ui-strings`).
- Modal korzysta ze wspólnych hooków dostępności z `modal-a11y-hooks-and-camera-cleanup` (jeśli wdrożone wcześniej; w przeciwnym razie zachowuje obecny Escape).

## Capabilities

### New Capabilities

- `admin-panel-structure`: panel administratora rozróżnia i pokazuje stany błędów (wygasła sesja, nieudane tworzenie/usuwanie) zamiast pustej tabeli lub `alert()`.

### Modified Capabilities

(brak — funkcje panelu pozostają takie same)

## Impact

- `apps/web/src/app/[locale]/admin/page.tsx`, nowe `components/admin/*`, `hooks/useAdminApi.ts`, klucze w `apps/web/messages/*.json`, e2e `admin-management`.
- Bez zmian API i bazy. Token administratora pozostaje w pamięci komponentu (bez persystencji).
- N100: bez wpływu.

## Non-goals / Poza zakresem

- Brak trwałego przechowywania tokenu administratora (po odświeżeniu nadal logowanie od nowa).
- Brak nowych funkcji panelu (edycja galerii, wyszukiwanie itp.).
- Brak zmian tras `api/admin/*`.
