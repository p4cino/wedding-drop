# gallery/custom-branding Specification

## Purpose
System SHALL umożliwiać właścicielom galerii dostosowanie jej wyglądu dla gości poprzez wgranie własnego logo oraz niestandardowego tła. Pozwala to na pełniejszą personalizację doznania z używania aplikacji w trakcie wesela.

## Requirements

### Requirement: Wgrywanie i usuwanie własnego logo przez właściciela galerii
Aplikacja SHALL pozwalać właścicielowi na wgranie i zresetowanie logo galerii w formacie graficznym. Po wgraniu, logo SHALL zastępować tekstową nazwę pary młodej we wszystkich widokach gości, łącznie z nawigacją.

#### Scenario: Udane wgranie logo
- **WHEN** właściciel wybierze plik ze wspieranym rozszerzeniem (np. PNG/JPG) i zatwierdzi wgrywanie w panelu
- **THEN** system zapisuje plik, powiązuje go z galerią, a widok gości natychmiastowo aktualizuje się, by ukryć imiona pary i wyświetlać nowo wgrane logo

#### Scenario: Zresetowanie logo
- **WHEN** właściciel usunie logo używając dedykowanego przycisku w panelu
- **THEN** system przywraca standardowy sposób renderowania nazwy pary młodej w widoku gościa i usuwa powiązany plik z systemu

### Requirement: Wgrywanie i ustawianie własnego tła przez właściciela galerii
Aplikacja SHALL pozwalać właścicielowi na zdefiniowanie niestandardowego tła pod główną siatką zdjęć w galerii, celem dopasowania interfejsu do stylistyki wesela.

#### Scenario: Zdefiniowanie tła jako pliku graficznego
- **WHEN** właściciel prześle nowe tło graficzne
- **THEN** strona główna galerii gości wyświetla ten plik w odpowiedniej warstwie z tyłu z nałożonym overlayem zapobiegającym nieczytelności zdjęć
