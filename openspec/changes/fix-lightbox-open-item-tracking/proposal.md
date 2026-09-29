# Proposal

## Why

W `apps/web/src/app/[locale]/g/[slug]/page.tsx:131-162` indeks otwartego lightboxa jest korygowany ręcznie przy zdarzeniach SSE, a przy usunięciu elementu wywołanie `setLightboxIndex` odbywa się **wewnątrz updatera** `setItems(prev => …)`. Updater musi być czysty — w React StrictMode (i przy ponownym uruchomieniu renderu) odpala się dwukrotnie, więc indeks może przesunąć się podwójnie i lightbox pokaże inne zdjęcie niż oglądane. Dodatkowo `new-media` przesuwa indeks o +1 także wtedy, gdy zdarzenie jest duplikatem i lista się nie zmienia.

## What Changes

- Stan lightboxa przechowuje `id` otwartego elementu (`lightboxId: string | null`), a indeks jest wyliczany z bieżącej listy (`items.findIndex`). Cała ręczna korekta indeksów (ok. 20 linii) znika.
- Gdy otwarty element zostanie ukryty/usunięty, lightbox przechodzi na sąsiada (następny, a jeśli go nie ma — poprzedni) albo zamyka się, gdy lista jest pusta.
- `LightboxModal` dostaje `currentId`/`onNavigate(id)` zamiast `currentIndex`/`onNavigate(index)` (kontrakt zewnętrzny komponentu zmienia się; testy `LightboxModal.test.tsx` są aktualizowane).

## Capabilities

### New Capabilities

- `guest-lightbox-stability`: otwarty podgląd zdjęcia/filmu pozostaje na tym samym elemencie niezależnie od tego, jakie zdarzenia na żywo docierają do galerii.

### Modified Capabilities

(brak — to poprawka błędu, bez nowej funkcji dla użytkownika)

## Impact

- `apps/web/src/app/[locale]/g/[slug]/page.tsx`, `apps/web/src/components/LightboxModal.tsx`, testy jednostkowe i e2e galerii gościa.
- Bez zmian API/bazy. Bez wpływu na ograniczenia N100. Prywatność: ukryty/usunięty element nadal natychmiast znika z widoku gościa.
- Zależność: najlepiej wykonać po `extract-live-gallery-hook` (reducer upraszcza implementację), ale zmiana jest wykonalna niezależnie.

## Non-goals / Poza zakresem

- Brak zmian w gestach swipe/klawiaturze lightboxa ani focus-trapie (patrz `modal-a11y-hooks-and-camera-cleanup`).
- Brak zmian w wyglądzie lightboxa.
