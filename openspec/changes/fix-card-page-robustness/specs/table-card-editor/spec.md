# Spec Delta

## Purpose

Edytor karteczki na stół działa poprawnie także dla nieistniejącej galerii oraz przy błędach generowania kodu QR.

## ADDED Requirements

### Requirement: Obsługa nieistniejącej galerii w edytorze karty
Gdy galeria o podanym slugu nie istnieje (odpowiedź 404), edytor SHALL wyświetlić komunikat „galeria nie znaleziona" i SHALL NOT pokazywać przykładowego podglądu karty ani akcji druku/pobrania PDF.

#### Scenario: Nieistniejący slug
- **WHEN** użytkownik otworzy `/g/nie-ma-takiej/card`
- **THEN** widzi ekran „galeria nie znaleziona", bez podglądu z przykładowymi imionami

#### Scenario: Błąd sieci
- **WHEN** pobranie danych galerii zakończy się błędem sieci
- **THEN** edytor pokazuje stan błędu z możliwością ponowienia, a nie ekran „galeria nie znaleziona"

### Requirement: Kod QR odpowiada ostatnio wybranym kolorom
Podgląd kodu QR SHALL zawsze odpowiadać ostatnio wybranemu kolorowi, niezależnie od kolejności zakończenia asynchronicznych generowań, a błąd generowania SHALL NOT powodować nieobsłużonego odrzucenia obietnicy.

#### Scenario: Szybka zmiana koloru
- **WHEN** użytkownik szybko zmieni kolor dwa razy pod rząd
- **THEN** wyświetlany QR ma kolor drugiego wyboru, nawet jeśli pierwsze generowanie skończyło się później

#### Scenario: Błąd generowania QR
- **WHEN** generowanie QR zakończy się błędem
- **THEN** podgląd pokazuje brak QR i komunikat, a aplikacja nie zgłasza nieobsłużonego wyjątku

### Requirement: Jedno źródło adresu galerii i kolorów domyślnych
Adres galerii kodowany w QR SHALL być budowany przez wspólną funkcję, a domyślne kolory karty SHALL pochodzić z jednej stałej używanej przez stronę i API.

#### Scenario: Zmiana domyślnego koloru
- **WHEN** zmieniona zostanie stała domyślnych kolorów karty
- **THEN** zmiana obejmuje zarówno edytor, jak i odpowiedź API galerii
