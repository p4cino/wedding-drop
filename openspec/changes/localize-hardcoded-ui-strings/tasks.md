# Tasks

## 1. Klucze i test parzystości

- [ ] 1.1 Dodaj test `apps/web/tests/unit/messages-parity.test.ts` (te same klucze w pl/en/de) i uruchom go — powinien przejść dla obecnych plików
- [ ] 1.2 Dodaj klucze do `pl.json`, `en.json`, `de.json`: `GuestGallery.lightboxAria`, `slideAnnouncement`, `videoAria`, `imageAria`, `Common.opensInNewTab`, `Common.backToHome`, `Common.footerTagline`, namespace `Offline`, `Meta`, klucze aria edytora karty

## 2. Użycie kluczy

- [ ] 2.1 Zastąp twarde teksty w `LightboxModal.tsx` i `MediaGrid.tsx`; zaktualizuj `LightboxModal.test.tsx` i `MediaGrid.test.tsx`
- [ ] 2.2 Zlokalizuj `(legal)/layout.tsx`, `~offline/page.tsx` i `RefreshButton.tsx`
- [ ] 2.3 Zamień statyczne `metadata` na `generateMetadata` w `[locale]/layout.tsx` (zachowaj `robots: noindex`) i `~offline/page.tsx`; zweryfikuj `pnpm --filter @wedding-drop/web build`
- [ ] 2.4 Zlokalizuj sr-only i `alert()` w `admin/page.tsx` oraz `aria-label` w `card/page.tsx` (koordynacja z `split-admin-page` i `fix-card-page-robustness`)

## 3. Weryfikacja

- [ ] 3.1 Zweryfikuj manualnie ekran offline, lightbox i stronę prawną w trzech językach oraz e2e (`pl-PL`)
- [ ] 3.2 `pnpm lint`, `check-types`, `pnpm test:coverage` + `node scripts/check-coverage.js`
