# Proposal

## Why

Evolly pokazuje ranking TOP 3 gości z liczbą wgranych zdjęć/filmów i odznakami medalowymi — to prosty mechanizm "społecznego dowodu słuszności", który realnie zwiększa liczbę uploadów, bo goście widzą, że inni już aktywnie dodają zdjęcia i chcą dogonić liderów. WeddingDrop dziś pokazuje tylko łączną liczbę zdjęć/filmów w galerii, bez podziału na poszczególnych gości.

## What Changes

- W galerii gościa (`/g/[slug]`) nowy, niewielki widget "Najaktywniejsi goście" pokazujący TOP 3 podpisy (`uploaderName`) z liczbą wgranych zdjęć/filmów i odznaką miejsca (🥇🥈🥉).
- Ranking liczy wyłącznie materiały widoczne publicznie (`status: "ready"`) — ukryte/skasowane zdjęcia nigdy nie wpływają na wynik ani nie są liczone na korzyść żadnego gościa.
- Podpisy są grupowane w sposób odporny na drobne różnice (spacje, wielkość liter), by "Wujek Janusz" i "wujek janusz " liczyły się jako ten sam gość.
- Ranking aktualizuje się na żywo w miarę wgrywania nowych zdjęć (ten sam SSE, co reszta galerii).

## Capabilities

### New Capabilities

- `guest-contributor-leaderboard`: publiczny ranking gości z największą liczbą wgranych, widocznych materiałów w danej galerii, aktualizowany na żywo.

### Modified Capabilities

(brak — czysta funkcja odczytowa/agregująca nad istniejącymi danymi `media_items`; nie zmienia zachowania uploadu ani moderacji)

## Impact

- Nowy komponent UI w galerii gościa (`apps/web/src/components/ContributorLeaderboard.tsx`), liczący ranking **po stronie klienta** z listy materiałów, którą galeria gościa już dziś wczytuje i utrzymuje na żywo (`items` w `g/[slug]/page.tsx`) — brak nowego endpointu API i brak nowego zapytania do bazy danych.
- Brak zmian w schemacie bazy danych, w `packages/media`, ani w potoku przetwarzania — czysto prezentacyjna funkcja nad już posiadanymi w przeglądarce danymi.
- Zero dodatkowego obciążenia serwera N100 — agregacja to proste zliczenie w pamięci przeglądarki nad tablicą, która i tak jest tam już od dawna.

## Non-goals / Poza zakresem

- Brak rozbudowanej gamifikacji poza TOP 3 (bez odznak za konkretne kamienie milowe, bez punktów, bez osobnej gry typu "bingo weselne").
- Brak rozróżniania zdjęć od filmów w rankingu — liczy się łączna liczba wgranych materiałów.
- Brak możliwości wyłączenia rankingu przez Parę Młodą w tej iteracji (widget jest zawsze widoczny, gdy w galerii jest co najmniej jeden gość z wgranym materiałem) — konfigurowalność widoczności to naturalne rozszerzenie na później, nieobjęte tym wnioskiem.
