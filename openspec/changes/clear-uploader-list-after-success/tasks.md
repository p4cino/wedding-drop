# Tasks

## 1. UploaderDrawer — czyszczenie kolejki

- [x] 1.1 Dodać flagę sesji sukcesu (np. `justFinished`) oraz helper resetujący kolejkę i natywny `input[type=file]` w `apps/web/src/components/UploaderDrawer.tsx`; zweryfikować TypeScript (`pnpm --filter @wedding-drop/web check-types`) bez błędów w tym pliku
- [x] 1.2 Po pełnym sukcesie pętli `startUpload` wyczyścić `files` natychmiast i ustawić stan sukcesu UI (przycisk `doneBtn` przy pustej liście); zweryfikować ręcznie lub testem, że nazwy plików znikają zaraz po sukcesie
- [x] 1.3 Przy częściowych błędach usuwać z listy tylko `completed`, zostawiając `error`; zweryfikować, że przy samym błędzie lista nie jest w pełni czyszczona
- [x] 1.4 Przy każdym zamknięciu drawera (X, Escape, Gotowe) resetować kolejkę i flagę sukcesu przed/wraz z `onClose`; zweryfikować, że po `isOpen: false → true` lista jest pusta

## 2. Testy i dokumentacja

- [x] 2.1 Zaktualizować `apps/web/tests/unit/components/UploaderDrawer.test.tsx`: po sukcesie brak nazwy pliku na liście + nadal `doneBtn`; dodać case reopen (pending → close → open → pusta lista) oraz partial failure gdy mock TUS na to pozwala; zweryfikować `pnpm --filter @wedding-drop/web exec vitest run tests/unit/components/UploaderDrawer.test.tsx`
- [x] 2.2 Sprawdzić E2E gościa (`guest-journey` / upload), czy asercje nie zakładają listy completed; dostosować tylko jeśli padają; zweryfikować odpowiednim `playwright test` lub potwierdzić brak zależności
- [x] 2.3 Uzupełnić `DOCUMENTATION.md` (§ UX mobilny / upload gościa) o zdanie, że kolejka czyści się po pełnym sukcesie i nie przetrwa zamknięcia drawera; zweryfikować, że opis jest zgodny ze spec `guest-upload`
