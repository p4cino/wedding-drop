# Spec Delta

## Purpose

Panel administratora jasno komunikuje wygasłą sesję i niepowodzenia operacji zamiast wyświetlać pustą listę lub okna `alert()`.

## ADDED Requirements

### Requirement: Wygasła sesja administratora
Gdy chroniona trasa `api/admin/*` zwróci 401, panel SHALL wrócić do ekranu logowania z komunikatem o wygasłej sesji i SHALL NOT pokazywać pustej tabeli galerii.

#### Scenario: Token wygasł podczas pracy
- **WHEN** administrator wykona akcję, a API odpowie 401
- **THEN** panel wyświetla ekran logowania z informacją o wygasłej sesji

### Requirement: Błędy tworzenia i usuwania są widoczne inline
Nieudane utworzenie lub usunięcie galerii SHALL wyświetlać komunikat błędu w interfejsie panelu (bez `alert()`), a modal SHALL pozostać otwarty z zachowanymi danymi formularza po nieudanym utworzeniu.

#### Scenario: Nieudane utworzenie galerii
- **WHEN** API odrzuci utworzenie galerii (np. zajęty slug)
- **THEN** modal pozostaje otwarty, pola formularza zachowują wartości, a błąd jest widoczny w modalu

#### Scenario: Nieudane usunięcie galerii
- **WHEN** usunięcie galerii zakończy się błędem
- **THEN** galeria pozostaje na liście, a panel pokazuje komunikat błędu

### Requirement: Rozdzielenie odpowiedzialności strony administratora
Plik strony administratora SHALL składać widok z wydzielonych komponentów logowania, statystyk, tabeli i modala tworzenia oraz SHALL delegować wywołania API do wspólnego hooka.

#### Scenario: Struktura po zmianie
- **WHEN** zmiana zostanie zaakceptowana
- **THEN** `admin/page.tsx` nie zawiera bezpośrednich wywołań `fetch` ani markupu modala tworzenia
