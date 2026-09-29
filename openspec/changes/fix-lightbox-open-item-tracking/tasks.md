# Tasks

## 1. Testy odtwarzające błąd

- [ ] 1.1 Dodaj test (jsdom + `React.StrictMode`) strony/komponentu odtwarzający: usunięcie oglądanego elementu przesuwa lightbox o dokładnie jedno miejsce; test najpierw czerwony
- [ ] 1.2 Dodaj test: duplikat `new-media` przy otwartym lightboxie nie zmienia oglądanego elementu

## 2. Zmiana modelu stanu

- [ ] 2.1 Zmień `LightboxModal` na `currentId`/`onNavigate(id)` i zaktualizuj `LightboxModal.test.tsx`; zweryfikuj `pnpm --filter @wedding-drop/web test`
- [ ] 2.2 W `g/[slug]/page.tsx` zastąp `lightboxIndex` przez `lightboxId`, usuń ręczną korektę indeksów z handlerów SSE i dodaj wybór sąsiada po usunięciu (poza updaterem `setItems`)
- [ ] 2.3 Zweryfikuj, że testy z 1.1 i 1.2 przechodzą oraz że scenariusze e2e galerii gościa (`guest-journey`, `owner-moderation`) nadal przechodzą

## 3. Weryfikacja

- [ ] 3.1 Uruchom `pnpm lint`, `pnpm --filter @wedding-drop/web check-types`, `pnpm test:coverage` + `node scripts/check-coverage.js`
