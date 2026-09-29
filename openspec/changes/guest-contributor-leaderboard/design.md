# Design

## Context

Zobacz `proposal.md` — sekcja „Why”. `apps/web/src/app/[locale]/g/[slug]/page.tsx` już dziś wczytuje **całą** listę materiałów galerii (`GET /api/gallery/[slug]/media`, bez paginacji) do stanu `items` i utrzymuje ją na żywo przez SSE (wstawianie nowych, usuwanie ukrytych/skasowanych — patrz istniejąca obsługa zdarzeń `new-media`/`media-updated`). Każdy element już zawiera `uploaderName`. Oznacza to, że wszystkie dane potrzebne do rankingu są już w przeglądarce, zanim ta funkcja w ogóle powstanie.

## Goals / Non-Goals

**Goals:**
- Ranking to czysta funkcja czystej agregacji nad już posiadanymi danymi klienta — zero nowych zapytań sieciowych.
- Ranking pozostaje spójny z resztą galerii co do widoczności: skoro `items` już dziś zawiera tylko materiały widoczne dla danego widza (gość: tylko `ready`; właściciel: `ready`+`hidden`), ranking naturalnie dziedziczy tę samą zasadę bez dodatkowego kodu filtrującego.

**Non-Goals:**
- Brak własnego stanu ładowania/błędu w komponencie rankingu — komponent jest czysto prezentacyjny (przyjmuje `items` jako prop) i nie wykonuje żadnego I/O.

## Decisions

- **Ranking liczony funkcją czystą `computeLeaderboard(items: MediaItemData[]): { name: string; count: number }[]`, wywoływaną przy każdym renderze `GuestGalleryPage` (lub w `useMemo` po `items`), a nie osobnym zapytaniem API.** Alternatywa (nowy endpoint agregujący SQL) była pierwotnie rozważana w proposal.md, ale odrzucona: `GET /api/gallery/[slug]/media` już zwraca kompletne dane bez paginacji, więc dodatkowy round-trip do serwera byłby zbędnym powieleniem pracy, którą przeglądarka i tak już wykonała, pobierając listę.
- **Normalizacja klucza grupowania: `name.trim().toLowerCase()` jako klucz agregacji, ale wyświetlana etykieta to pierwszy napotkany (nieznormalizowany) zapis tego podpisu** — zachowuje naturalny wygląd imienia/nazwiska w UI, jednocześnie spełniając wymóg grupowania z niewrażliwością na wielkość liter/białe znaki ze spec.md.
- **`useMemo` z zależnością na `items`, przeliczany po każdej zmianie tej tablicy** (czyli po każdym zdarzeniu SSE, które już dziś aktualizuje `items`) — to samo źródło prawdy i ten sam cykl odświeżania co reszta galerii, bez osobnego nasłuchu SSE dedykowanego dla rankingu.
- **Widget renderowany warunkowo — ukryty całkowicie, gdy lista materiałów jest pusta**, zgodnie ze scenariuszem "Brak materiałów w galerii" ze spec.md.

## Risks / Trade-offs

- [Ryzyko: przy bardzo dużych galeriach (tysiące zdjęć) przeliczanie rankingu przy każdej zmianie `items` może kosztować dodatkowy czas CPU po stronie przeglądarki gościa] → Mitigacja: `useMemo` przelicza tylko przy faktycznej zmianie referencji `items`, a samo zliczenie to pojedyncze przejście po tablicy (O(n)) — pomijalne obciążenie nawet dla tysięcy elementów na współczesnym telefonie; brak wpływu na serwer N100, bo cała operacja dzieje się w przeglądarce.
- [Ryzyko: gdyby w przyszłości dodano paginację do `GET /api/gallery/[slug]/media` (dziś jej brak), ranking licząc tylko po stronie klienta przestałby widzieć pełny zbiór danych] → Mitigacja: udokumentowane jako świadome założenie tej decyzji projektowej — jeśli paginacja pojawi się w przyszłości, ranking będzie wymagał przeniesienia na osobne zapytanie agregujące API; nie jest to blokerem dzisiaj, bo paginacja nie istnieje.
