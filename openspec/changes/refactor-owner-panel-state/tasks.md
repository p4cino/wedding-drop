# Tasks

## 1. Typy i warstwa API

- [x] 1.1 Dodaj `apps/web/src/lib/owner-types.ts` (`GDriveExportStatus`, `GDriveState`, `OwnerPanelData`, `OwnerAuthResponse`) używany przez klienta; trasa serwera pozostaje bez typu współdzielonego (status w bazie to `string`, więc przypisanie do unii wymagałoby zawężenia po stronie serwera — poza zakresem)
- [x] 1.2 Dodaj `apps/web/src/hooks/useOwnerApi.ts` i testy (nagłówek dołączany, brak `token` w body, błąd sieci → wynik, nie wyjątek)

## 2. Stan Google Drive

- [x] 2.1 Dodaj hook `useGDriveExport` z atomowym `applyServerState` (mapowania w `lib/gdrive-state.ts`), pollingiem co 3 s z czyszczeniem interwału i testami; SSE obsługuje strona przez `useGalleryEvents`
- [x] 2.2 Przepisz `GDriveBackupCard` na obiekt `state` i usuń `!` (znikają ostrzeżenia biome `noNonNullAssertion`); zaktualizuj `GDriveBackupCard.test.tsx` (mapa `STATUS_VIEW` pominięta — cztery bloki statusu mają różną treść, nie tylko ikonę/kolor)
- [x] 2.3 Przenieś stan modala eksportu do `GDriveExportModal`/hooka; zaktualizuj `GDriveExportModal.test.tsx`

## 3. Strona panelu

- [x] 3.1 Wydziel `OwnerLoginForm`, `OwnerHeader` i `Toast`; zastąp `alert()` toastem, dodaj komunikaty błędów zamiast pustych `catch`
- [x] 3.2 Przepisz `owner/[slug]/page.tsx` na hooki (361 linii zamiast 683; dalsze zmniejszenie wymagałoby wydzielenia list moderacji — zmiana `shared-ui-primitives-and-utils`); e2e `owner-moderation` w weryfikacji Docker

## 4. Weryfikacja

- [ ] 4.1 `pnpm lint`, `check-types`, `pnpm test:coverage` + `node scripts/check-coverage.js`; zaktualizuj DOCUMENTATION.md (architektura panelu właściciela)
