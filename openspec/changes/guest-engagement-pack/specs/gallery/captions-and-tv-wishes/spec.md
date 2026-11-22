# Spec Delta

## Purpose

Pozwala gościom opatrzyć wgrywane zdjęcia i filmy krótkim podpisem kontekstowym (`caption`) oraz wzbogaca pełnoekranowy pokaz slajdów Trybu TV (`/g/[slug]/tv`) o podpisy do zdjęć, odznaki wyzwań, liczniki serduszek i przeplatane karty z Księgi Życzeń.

## ADDED Requirements

### Requirement: Opcjonalny krótki podpis (`caption`) do wgrywanego materiału
Szuflada uploadu (`UploaderDrawer`) SHALL udostępniać opcjonalne pole tekstowe na krótki podpis/komentarz do wgrywanych materiałów (maksymalnie 140 znaków), niezależne od pola podpisu autora (`uploaderName`). Podpis SHALL być walidowany, przycinany z białych znaków na brzegach, przekazywany w metadanych protokołu TUS i zwracany przez API galerii oraz zdarzenie SSE `new-media`.

#### Scenario: Wgranie zdjęcia z podpisem kontekstowym
- **WHEN** gość wpisze swoje imię „Wujek Janusz” oraz podpis zdjęcia „Stolik nr 4 bawi się najlepiej!” i prześle zdjęcie
- **THEN** po przetworzeniu zdjęcie w Lightboxie oraz w Trybie TV wyświetla zarówno autora („Wujek Janusz”), jak i treść podpisu („Stolik nr 4 bawi się najlepiej!”)

#### Scenario: Przekroczenie maksymalnej długości podpisu
- **WHEN** klient prześle w metadanych TUS podpis `caption` dłuższy niż 140 znaków
- **THEN** walidator metadanych TUS odrzuca utworzenie uploadu kodem `400 Bad Request`

### Requirement: Prezentacja podpisu, odznaki wyzwania i licznika serduszek w Trybie TV
Widok Trybu TV (`/g/{slug}/tv`) SHALL wyświetlać na slajdzie prezentowanego materiału jego podpis (`caption`, jeśli został podany), odznakę przypisanego foto-wyzwania (jeśli `questId` odpowiada wyzwaniu galerii) oraz aktualną liczbę polubień (`likesCount`, gdy jest większa od `0`), aktualizowaną na żywo przez SSE.

#### Scenario: Slajd w Trybie TV pokazuje metadane zaangażowania
- **WHEN** w rotacji Trybu TV wyświetlane jest zdjęcie posiadające podpis, przypisane wyzwanie oraz co najmniej jedno polubienie
- **THEN** na ekranie TV obok autora widoczne są: treść podpisu, tytuł wyzwania oraz licznik serduszek ❤️

### Requirement: Przeplatanie slajdów zdjęć kartami z Księgi Życzeń w Trybie TV
Widok Trybu TV (`/g/{slug}/tv`) SHALL pobierać i subskrybować na żywo widoczne wpisy z Księgi Życzeń (`status: "ready"`) oraz automatycznie wplatać pełnoekranowe karty z życzeniami pomiędzy slajdy z materiałami multimedialnymi (lub wyświetlać same karty życzeń, jeśli w galerii nie ma jeszcze zdjęć, ale są już życzenia).

#### Scenario: Rotacja przeplata zdjęcia i życzenia
- **WHEN** w galerii znajdują się widoczne zdjęcia oraz co najmniej jedno widoczne życzenie (`status: "ready"`)
- **THEN** pokaz slajdów w Trybie TV cyklicznie wyświetla pełnoekranową kartę z treścią życzenia i podpisem autora pomiędzy kolejnymi slajdami zdjęć

#### Scenario: Nowe życzenie pojawia się na ekranie TV na żywo
- **WHEN** gość doda nowe życzenie, które otrzymuje status `ready` (zdarzenie SSE `new-wish`)
- **THEN** widok Trybu TV natychmiast prezentuje kartę z nowym życzeniem na ekranie bez ręcznego odświeżania strony

#### Scenario: Ukryte życzenie natychmiast znika z Trybu TV
- **WHEN** właściciel galerii ukryje lub usunie życzenie w panelu moderacji (zdarzenie SSE `wish-updated` ze statusem `hidden` lub `deleted`)
- **THEN** życzenie to natychmiast znika z ekranu i zostaje usunięte z cyklu rotacji Trybu TV
