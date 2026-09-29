# Spec Delta

## Purpose

Wszystkie teksty interfejsu i etykiety dostępności są tłumaczone zgodnie z wybranym językiem (pl, en, de).

## ADDED Requirements

### Requirement: Brak twardo zakodowanych tekstów interfejsu
Teksty widoczne dla użytkownika oraz wartości `aria-label`/sr-only w komponentach lightboxa, siatki mediów, układu stron prawnych, strony offline, panelu administratora i edytora karty SHALL pochodzić z plików tłumaczeń `next-intl`.

#### Scenario: Lightbox w języku angielskim
- **WHEN** gość otworzy galerię w języku angielskim i uruchomi podgląd zdjęcia
- **THEN** etykieta podglądu i komunikat „element X z Y" są po angielsku

#### Scenario: Ekran offline w języku niemieckim
- **WHEN** przeglądarka wyświetli stronę offline dla ścieżki `/de/~offline`
- **THEN** treść i przycisk odświeżenia są po niemiecku

### Requirement: Metadane strony zależne od języka
Tytuł i opis dokumentu (`metadata`) SHALL być generowane z tłumaczeń dla bieżącego języka.

#### Scenario: Tytuł strony w języku angielskim
- **WHEN** użytkownik otworzy stronę pod `/en/...`
- **THEN** tytuł dokumentu jest po angielsku

### Requirement: Spójność zbiorów kluczy tłumaczeń
Pliki `pl.json`, `en.json` i `de.json` SHALL zawierać identyczne zbiory kluczy, a niezgodność SHALL powodować niepowodzenie testu jednostkowego.

#### Scenario: Brakujący klucz w jednym języku
- **WHEN** klucz istnieje w `pl.json`, a brakuje go w `de.json`
- **THEN** test parzystości kluczy kończy się niepowodzeniem i wskazuje brakujący klucz
