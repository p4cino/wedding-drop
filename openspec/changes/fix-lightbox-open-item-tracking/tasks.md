# Tasks

## 1. Testy odtwarzające błąd

- [x] 1.1 Dodaj test (jsdom + `React.StrictMode`) strony/komponentu odtwarzający: usunięcie oglądanego elementu przesuwa lightbox o dokładnie jedno miejsce; test najpierw czerwony
- [x] 1.2 Dodaj test: duplikat `new-media` przy otwartym lightboxie nie zmienia oglądanego elementu

## 2. Zmiana modelu stanu

- [x] 2.1 Dodaj hook `useLightboxSelection` (stan po `id`, sąsiad po usunięciu, zamknięcie przy pustej liście); kontrakt `LightboxModal` pozostaje bez zmian
- [x] 2.2 W `g/[slug]/page.tsx` zastąp `lightboxIndex` przez `lightboxId`, usuń ręczną korektę indeksów z handlerów SSE i dodaj wybór sąsiada po usunięciu (poza updaterem `setItems`)
- [ ] 2.3 Zweryfikuj, że testy z 1.1 i 1.2 przechodzą oraz że scenariusze e2e galerii gościa (`guest-journey`, `owner-moderation`) nadal przechodzą

## 3. Weryfikacja

- [ ] 3.1 Uruchom `pnpm lint`, `pnpm --filter @wedding-drop/web check-types`, `pnpm test:coverage` + `node scripts/check-coverage.js`
