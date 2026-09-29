# Tasks

## 1. Typy i reducer

- [x] 1.1 Utwórz `apps/web/src/lib/gallery-types.ts` (`GalleryData`, `MediaItemData`, `WishItemData`), przenieś definicje z `LightboxModal.tsx`, `WishesBook.tsx`, `g/[slug]/page.tsx`, `tv/page.tsx`; zostaw re-eksporty i zweryfikuj `pnpm --filter @wedding-drop/web check-types`
- [x] 1.2 Zmień importy w `lib/leaderboard.ts` i komponentach na `lib/gallery-types`, żeby `lib/` nie importowało z `components/`; zweryfikuj `check-types`
- [x] 1.3 Zaimplementuj czysty `galleryReducer` w `apps/web/src/lib/live-gallery.ts` i pokryj testami jednostkowymi: wstawienie na górę, duplikat, `hidden`/`deleted`, `new-wish`, `wish-updated`

## 2. Hooki

- [x] 2.1 Dodaj `apps/web/src/hooks/useGalleryEvents.ts` (cleanup, `isLive`, `onOpen`/`onError`, odporność na błędny JSON) i zweryfikuj testem z mockiem `EventSource`
- [x] 2.2 Dodaj `apps/web/src/hooks/useLiveGallery.ts` ze stanami `loading`/`ready`/`notFound`/`error`, `refetch` i `refetchWithBackoff` z anulowaniem; zweryfikuj testem (404 vs błąd sieci, wznowienie SSE wywołuje refetch)

## 3. Migracja stron

- [x] 3.1 Dodaj `components/GalleryStatusScreen.tsx` (loading/notFound/error, wariant jasny/ciemny) i zweryfikuj testem renderowania
- [x] 3.2 Przepisz `g/[slug]/page.tsx` na `useLiveGallery` + `GalleryStatusScreen`, usuwając trzy `setTimeout`; zweryfikuj `pnpm --filter @wedding-drop/web test` i e2e `guest-journey`
- [x] 3.3 Przepisz `g/[slug]/tv/page.tsx` na `useLiveGallery`, zweryfikuj, że po symulowanym zerwaniu SSE dane są pobierane ponownie (test) oraz że e2e UC9/UC10 TV nadal przechodzą
- [ ] 3.4 Użyj wspólnego pobrania danych galerii w `card/page.tsx` (bez zmiany zachowania kart; obsługa 404 w `fix-card-page-robustness`)

## 4. Dokumentacja i weryfikacja

- [x] 4.1 Zaktualizuj DOCUMENTATION.md (sekcja architektury klienta: hooki galerii) i sprawdź `pnpm lint`, `pnpm test:coverage` + `node scripts/check-coverage.js` (próg 80%)
