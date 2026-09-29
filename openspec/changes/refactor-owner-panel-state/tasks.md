# Tasks

## 1. Typy i warstwa API

- [ ] 1.1 Dodaj `apps/web/src/lib/owner-types.ts` (`GDriveExportStatus`, `OwnerAuthResponse`, `OwnerMediaItem`, `OwnerWishItem`) i użyj `OwnerAuthResponse` w trasie `POST /api/owner/[slug]/auth`; zweryfikuj `check-types` i testy integracyjne tras owner
- [ ] 1.2 Dodaj `apps/web/src/hooks/useOwnerApi.ts` i testy (nagłówek dołączany, brak `token` w body, błąd sieci → wynik, nie wyjątek)

## 2. Stan Google Drive

- [ ] 2.1 Dodaj reducer/hook `useGDriveExport` z atomowym `applyServerState`, SSE i pollingiem co 3 s (czyszczenie interwału) oraz testy reducera
- [ ] 2.2 Przepisz `GDriveBackupCard` na obiekt `state`, mapę `STATUS_VIEW` i usuń `!` (znikają ostrzeżenia biome `noNonNullAssertion`); zaktualizuj `GDriveBackupCard.test.tsx`
- [ ] 2.3 Przenieś stan modala eksportu do `GDriveExportModal`/hooka; zaktualizuj `GDriveExportModal.test.tsx`

## 3. Strona panelu

- [ ] 3.1 Wydziel `OwnerLoginForm`, `OwnerHeader` i `Toast`; zastąp `alert()` toastem, dodaj komunikaty błędów zamiast pustych `catch`
- [ ] 3.2 Przepisz `owner/[slug]/page.tsx` na hooki; zweryfikuj rozmiar (~250 linii) i e2e `owner-moderation`

## 4. Weryfikacja

- [ ] 4.1 `pnpm lint`, `check-types`, `pnpm test:coverage` + `node scripts/check-coverage.js`; zaktualizuj DOCUMENTATION.md (architektura panelu właściciela)
