# Spec Delta

## Purpose

Pokazuje gościom publiczny ranking TOP 3 osób, które wgrały najwięcej widocznych zdjęć/filmów do danej galerii, aktualizowany na żywo, jako zachętę do dalszego dodawania materiałów.

## ADDED Requirements

### Requirement: Publiczny ranking TOP 3 gości wg liczby wgranych materiałów
System SHALL udostępniać publicznie, bez logowania, ranking maksymalnie trzech podpisów gości (`uploaderName`) z największą liczbą wgranych materiałów w danej galerii.

#### Scenario: Ranking wyświetla trzech najaktywniejszych gości
- **WHEN** galeria zawiera materiały wgrane przez co najmniej trzech różnych gości
- **THEN** system zwraca dokładnie trzy pozycje uszeregowane malejąco według liczby wgranych materiałów

#### Scenario: Mniej niż trzech gości
- **WHEN** galeria zawiera materiały wgrane przez mniej niż trzech różnych gości (np. jednego lub dwóch)
- **THEN** system zwraca tylko tylu gości, ilu faktycznie wgrało materiały, bez sztucznego dopełniania listy

#### Scenario: Brak materiałów w galerii
- **WHEN** galeria nie zawiera jeszcze żadnych widocznych materiałów
- **THEN** system zwraca pustą listę rankingu zamiast błędu

### Requirement: Ranking liczy wyłącznie materiały o statusie „ready”
Ranking SHALL uwzględniać wyłącznie materiały o statusie `ready` i SHALL NOT liczyć materiałów o statusie `hidden` lub `deleted` na korzyść żadnego gościa.

#### Scenario: Ukrycie materiału zmniejsza wynik gościa
- **WHEN** właściciel galerii ukryje jeden z materiałów wgranych przez danego gościa
- **THEN** liczba materiałów przypisana temu gościowi w rankingu spada o jeden, tak jakby ten materiał nigdy nie został policzony

### Requirement: Normalizacja podpisów gości przy grupowaniu
System SHALL grupować materiały w rankingu po znormalizowanym podpisie gościa (bez rozróżniania wielkości liter oraz bez wiodących/końcowych białych znaków), tak aby drobne różnice zapisu tego samego imienia nie tworzyły osobnych pozycji w rankingu.

#### Scenario: Różne zapisy tego samego podpisu liczą się razem
- **WHEN** jeden gość wgra materiały podpisane raz jako "Wujek Janusz", a innym razem jako "wujek janusz " (ze spacją na końcu)
- **THEN** oba wgrania liczą się do tej samej pozycji w rankingu, wyświetlanej z jedną, spójną formą podpisu

### Requirement: Aktualizacja rankingu na żywo
Widok rankingu SHALL aktualizować się w czasie rzeczywistym w miarę wgrywania nowych materiałów, bez konieczności ręcznego odświeżania strony.

#### Scenario: Nowe wgranie zmienia kolejność rankingu
- **WHEN** gość wgra nowy materiał, który zmienia kolejność TOP 3
- **THEN** widoczny ranking aktualizuje się u wszystkich otwartych widoków galerii w ciągu kilku sekund od zakończenia przetwarzania materiału
