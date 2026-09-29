# Tasks

## 1. Narzędzia bez UI

- [ ] 1.1 Dodaj `packages/db/src/slug.ts` (`sanitizeSlug`), wyeksportuj z pakietu i dodaj test tabelaryczny porównujący z dotychczasowym wyrażeniem dla zestawu wejść; zweryfikuj `pnpm --filter @wedding-drop/db test`
- [ ] 1.2 Użyj `sanitizeSlug` w `api/admin/galleries/route.ts` i `[locale]/page.tsx` (bez nawigacji przy pustym wyniku, z komunikatem walidacji); zweryfikuj testy trasy admina
- [ ] 1.3 Dodaj `apps/web/src/lib/format.ts` (`formatMegabytes`) z testem tabelarycznym i podmień 6 miejsc użycia

## 2. Komponenty

- [ ] 2.1 Dodaj `lib/moderation.ts` (typy, `filterByStatus`) oraz `ModerationFilterBar` i `ModerationActions` z testami
- [ ] 2.2 Przepisz `MediaGridWithModeration` i `WishesModeration` na wspólne komponenty z lokalnym stanem filtra, usuń stany `filter`/`wishesFilter` i rzutowania z `owner/[slug]/page.tsx`; zaktualizuj istniejące testy
- [ ] 2.3 Dodaj `StatTile` do `OwnerStatsGrid` (prop liczbowy) i zaktualizuj `OwnerStatsGrid.test.tsx`
- [ ] 2.4 Dodaj `EmptyState` i użyj w `MediaGrid` oraz `WishesBook`; zaktualizuj testy

## 3. Weryfikacja

- [ ] 3.1 `pnpm lint`, `check-types`, `pnpm test:coverage` + `node scripts/check-coverage.js`, e2e `owner-moderation` i `admin-management`
- [ ] 3.2 Zaktualizuj DOCUMENTATION.md (wspólne prymitywy, `sanitizeSlug`)
