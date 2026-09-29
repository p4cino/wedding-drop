# Design

## Context

Dziś `page.tsx` trzyma `lightboxIndex: number | null` i przy każdym zdarzeniu SSE przelicza go ręcznie (+1 przy `new-media`, złożona logika przy `hidden/deleted`, w tym `setLightboxIndex` wewnątrz `setItems`). To łamie kontrakt czystości updaterów, powiela reguły „co po usunięciu" i wymaga uwagi przy każdej nowej ścieżce zmiany listy.

## Goals / Non-Goals

**Goals:**
- Usunąć całą klasę błędów „indeks przesunął się" przez zmianę modelu stanu.
- Zredukować `page.tsx` o ok. 20 linii bez zmiany zachowania widocznego dla gościa.

**Non-Goals:**
- Przepisywanie `LightboxModal` (gesty, klawiatura, focus trap).

## Decisions

- **`lightboxId: string | null` zamiast indeksu.** Indeks liczony przy renderze: `const index = lightboxId ? items.findIndex(i => i.id === lightboxId) : -1`. `findIndex` na liście rzędu setek/tysięcy elementów jest tanie i uruchamia się tylko przy otwartym lightboxie.
- **Sąsiad po usunięciu w czystym efekcie, nie w updaterze.** `useEffect` (lub pochodna wartość) sprawdza, czy `lightboxId` nadal jest na liście; jeśli nie, wybiera element o tym samym położeniu z poprzedniej listy (`prevItemsRef`) lub poprzedni, a gdy lista jest pusta — `null`. Alternatywa: reducer z `extract-live-gallery-hook` zwraca `removedNeighborId`; wybieramy najprostsze, co działa w obu kolejnościach wdrożenia.
- **Kontrakt `LightboxModal`:** propsy `currentId`, `onNavigate(id)`; nawigacja prev/next wyznacza sąsiada z `items` wewnątrz komponentu. Testy `LightboxModal.test.tsx` przechodzą na `id`.

## Risks / Trade-offs

- [Ryzyko: efekt korygujący powoduje jedno dodatkowe renderowanie po usunięciu] → Mitigacja: renderowanie jednego lightboxa jest tanie; alternatywa (reducer) usuwa to, gdy `extract-live-gallery-hook` jest wdrożony.
- [Ryzyko: zmiana publicznego kontraktu komponentu] → Mitigacja: komponent jest używany tylko na stronie `/g/[slug]` i w testach; kompilator (`check-types`) wskaże wszystkie miejsca.
