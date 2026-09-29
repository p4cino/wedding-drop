# Spec Delta

## Purpose

Otwarty lightbox gościa pokazuje wciąż ten sam element, nawet gdy w tle na żywo dodawane, ukrywane lub usuwane są inne materiały.

## ADDED Requirements

### Requirement: Lightbox śledzi otwarty element po identyfikatorze
Otwarty lightbox SHALL identyfikować aktualnie oglądany materiał po jego `id`, a nie po pozycji na liście, tak aby zmiany listy nie zmieniały oglądanego materiału.

#### Scenario: Nowe zdjęcie na górze nie przesuwa podglądu
- **WHEN** gość ma otwarty podgląd zdjęcia, a w galerii pojawia się nowe zdjęcie od innego gościa
- **THEN** lightbox nadal pokazuje to samo zdjęcie

#### Scenario: Duplikat zdarzenia nie zmienia podglądu
- **WHEN** klient odbierze dwukrotnie to samo zdarzenie `new-media` podczas otwartego podglądu
- **THEN** lightbox nadal pokazuje to samo zdjęcie

### Requirement: Ukrycie lub usunięcie oglądanego elementu
Gdy oglądany materiał zostanie ukryty lub usunięty, lightbox SHALL przejść na następny materiał, a jeśli go nie ma — na poprzedni; gdy lista stanie się pusta, SHALL się zamknąć. Ukryty lub usunięty materiał SHALL NOT pozostać widoczny.

#### Scenario: Usunięcie oglądanego zdjęcia
- **WHEN** właściciel ukryje zdjęcie, które gość ma właśnie otwarte w lightboxie
- **THEN** lightbox pokazuje sąsiednie zdjęcie, a ukryte znika z galerii

#### Scenario: Usunięcie ostatniego elementu
- **WHEN** ukryty zostaje jedyny element na liście
- **THEN** lightbox zamyka się

### Requirement: Czyste aktualizacje stanu
Aktualizacja listy materiałów po zdarzeniu SSE SHALL NOT wywoływać efektów ubocznych (w tym zmiany stanu lightboxa) wewnątrz funkcji updatera stanu.

#### Scenario: Podwójne wykonanie updatera w StrictMode
- **WHEN** aplikacja działa w React StrictMode i odbiera zdarzenie usunięcia elementu
- **THEN** lightbox pokazuje dokładnie jednego sąsiada usuniętego elementu, bez podwójnego przesunięcia
