# Spec Delta

## Purpose

Jednolite, przewidywalne zachowanie kolejki wysyłania plików w galerii gościa i w imporcie materiałów fotografa.

## ADDED Requirements

### Requirement: Wspólna konfiguracja uploadu TUS
Klient SHALL wysyłać pliki przez jedną wspólną funkcję z tą samą konfiguracją (`chunkSize` 5 MB, dotychczasowe `retryDelays`, endpoint względny do bieżącego origin) zarówno dla uploadu gościa, jak i importu fotografa.

#### Scenario: Zmiana rozmiaru chunka w jednym miejscu
- **WHEN** zmieniony zostanie `chunkSize` we wspólnej funkcji uploadu
- **THEN** zmiana obejmuje jednocześnie upload gościa i import fotografa

### Requirement: Ograniczona częstość aktualizacji postępu
Kolejka SHALL aktualizować stan postępu pliku tylko wtedy, gdy postęp wynosi 100%, wzrósł o co najmniej 3 punkty procentowe od poprzedniej aktualizacji albo od poprzedniej aktualizacji upłynęło więcej niż 100 ms — także w imporcie fotografa.

#### Scenario: Duży plik nie powoduje lawiny renderów
- **WHEN** wysyłany jest duży film w imporcie fotografa
- **THEN** liczba aktualizacji stanu postępu jest ograniczona jak w uploadzie gościa

### Requirement: Jawna semantyka wyniku kolejki
Po zakończeniu kolejki system SHALL wywołać callback sukcesu tylko wtedy, gdy co najmniej jeden plik został wysłany, SHALL pokazać komunikat „wszystko wysłane" tylko wtedy, gdy żaden plik nie zakończył się błędem, oraz SHALL pozostawić nieudane pliki w kolejce z widocznym komunikatem błędu.

#### Scenario: Całkowita porażka
- **WHEN** wszystkie pliki zakończą się błędem
- **THEN** nie jest wywołany callback sukcesu, nie jest pokazany komunikat „wszystko wysłane", a pliki pozostają w kolejce z błędem

#### Scenario: Sukces częściowy
- **WHEN** część plików zostanie wysłana, a część zakończy się błędem
- **THEN** callback sukcesu jest wywołany raz, udane pliki są usunięte z kolejki, a nieudane pozostają z komunikatem błędu

### Requirement: Import fotografa zachowuje metadane autoryzacji
Import fotografa SHALL nadal przekazywać w metadanych TUS `source: "photographer"` oraz `ownerToken`, a upload gościa SHALL przekazywać podpis gościa i SHALL NOT przekazywać `ownerToken`.

#### Scenario: Metadane importu
- **WHEN** właściciel importuje plik przez panel importu
- **THEN** metadane uploadu zawierają `source=photographer` i `ownerToken`
