# Spec Delta

## Purpose

Wspólne prymitywy interfejsu i narzędzia używane w wielu miejscach mają jedną implementację i pokrycie testami.

## ADDED Requirements

### Requirement: Jednolita moderacja mediów i życzeń
Widoki moderacji zdjęć i życzeń SHALL używać wspólnego paska filtrów (wszystkie / widoczne / ukryte) oraz wspólnych przycisków akcji (ukryj/pokaż, usuń), a status SHALL być reprezentowany jednym typem `ModerationStatus`.

#### Scenario: Filtr ukrytych elementów
- **WHEN** właściciel wybierze filtr „ukryte" w widoku zdjęć lub życzeń
- **THEN** widoczne są wyłącznie elementy o statusie `hidden`, a aktywny filtr jest oznaczony `aria-pressed`

### Requirement: Spójne formatowanie rozmiaru w megabajtach
Wszystkie miejsca wyświetlające rozmiar w megabajtach SHALL używać jednej funkcji formatującej z jedną cyfrą po przecinku.

#### Scenario: Rozmiar pliku
- **WHEN** plik ma 1 572 864 bajty
- **THEN** interfejs pokazuje „1.5 MB" w każdym widoku, w którym ten rozmiar jest prezentowany

### Requirement: Jedna definicja sanityzacji slugu
System SHALL mieć jedną funkcję sanityzacji slugu (dozwolone znaki `a-z`, `0-9`, `_`, `-`) używaną w kliencie i w trasie admina, a wynik SHALL być identyczny z dotychczasowym dla każdego wejścia.

#### Scenario: Slug z niedozwolonymi znakami
- **WHEN** wejście to „Kasia & Tomek!"
- **THEN** wynik sanityzacji jest identyczny z wynikiem dotychczasowego `toLowerCase().replace(/[^a-z0-9_-]/g, "")` dla tego samego wejścia

#### Scenario: Pusty wynik na stronie głównej
- **WHEN** po sanityzacji slug jest pusty
- **THEN** strona główna nie nawiguje do `/g/` i pokazuje komunikat walidacji

### Requirement: Spójny pusty stan list
Puste listy zdjęć i życzeń SHALL używać wspólnego komponentu stanu pustego.

#### Scenario: Brak życzeń
- **WHEN** księga życzeń nie zawiera wpisów
- **THEN** widoczny jest stan pusty z ikoną, tytułem i podpowiedzią
