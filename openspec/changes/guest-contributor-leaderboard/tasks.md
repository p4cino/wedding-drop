# Tasks

## 1. Logika rankingu

- [x] 1.1 Zaimplementuj czystą funkcję `computeLeaderboard(items)` (np. w `apps/web/src/lib/leaderboard.ts`) zwracającą TOP 3 posortowane malejąco, z normalizacją podpisu opisaną w design.md, i zweryfikuj testem jednostkowym (Vitest) przypadków: różne wielkości liter/spacje grupują się razem, mniej niż 3 gości, pusta lista, remis w liczbie materiałów
- [x] 1.2 Zweryfikuj testem jednostkowym, że funkcja nie liczy materiałów spoza podanej tablicy (czyli że filtrowanie `ready`/`hidden` pozostaje odpowiedzialnością wywołującego, zgodnie z tym, co już dziś robi `items`)

## 2. Komponent UI

- [x] 2.1 Zaimplementuj `apps/web/src/components/ContributorLeaderboard.tsx` przyjmujący `items` jako prop, renderujący TOP 3 z odznakami miejsc (🥇🥈🥉) i liczbą materiałów, ukryty całkowicie przy pustej liście, i zweryfikuj testem jednostkowym renderowania (React Testing Library) dla 0, 1, 2 i 3+ unikalnych gości
- [x] 2.2 Podłącz `useMemo(() => computeLeaderboard(items), [items])` i osadź komponent w widoku galerii (`apps/web/src/app/[locale]/g/[slug]/page.tsx`), i zweryfikuj manualnie, że ranking aktualizuje się natychmiast po nadejściu zdarzenia SSE `new-media`
  - Uwaga wdrożeniowa: `useMemo` żyje wewnątrz `ContributorLeaderboard` (kolokowany z jedynym miejscem użycia), a nie zduplikowany w `page.tsx` — zgodnie z literalnym kontraktem propsów z design.md („komponent przyjmuje `items` jako prop”). `page.tsx` jedynie osadza `<ContributorLeaderboard items={items} />`; ponieważ ten sam stan `items` jest już dziś aktualizowany przez SSE, ranking i tak przelicza się automatycznie po każdym zdarzeniu `new-media`/`media-updated`.

## 3. Tłumaczenia i testy end-to-end

- [x] 3.1 Dodaj nowe klucze tłumaczeń (PL/EN/DE) dla nagłówka rankingu i etykiet miejsc w `apps/web/messages/*.json` i zweryfikuj `pnpm --filter @wedding-drop/web check-types` oraz manualny podgląd w każdym języku
  - Zweryfikowano `check-types` (czysto) oraz manualnie treść zserwowanej strony `/pl/g/kasia-i-tomek` na żywym stacku Docker (wd4) — poprawne klucze `leaderboardTitle`/`leaderboardRankAria`/`leaderboardCount` obecne w payloadzie next-intl dla pl/en/de.
- [x] 3.2 Dodaj scenariusz Playwright w `apps/web/e2e/guest-journey.spec.ts` potwierdzający, że po wgraniu materiałów przez różnych "gości" (różne `uploaderName` w metadanych uploadu) ranking pokazuje poprawną kolejność, i zweryfikuj przejście testu
  - UC8 dodany i zielony na wszystkich 3 projektach Playwright (chromium, Mobile Chrome, Mobile Safari) na realnym stacku Docker.
- [x] 3.3 Rozszerz scenariusz moderacji w `apps/web/e2e/owner-moderation.spec.ts` o sprawdzenie, że ukrycie materiału zmniejsza wynik danego gościa w rankingu, i zweryfikuj przejście testu
  - UC8 dodany (dwa konteksty przeglądarki: właściciel + gość, wspólny mutowalny stan mediów symulujący toggle-status) i zielony na wszystkich 3 projektach.
- [x] 3.4 Zaktualizuj `README.md` (sekcja "Dla Gości") o opis nowego widgetu rankingu zgodnie z AGENTS.md §7 i zweryfikuj, że opis odzwierciedla faktyczne zachowanie
