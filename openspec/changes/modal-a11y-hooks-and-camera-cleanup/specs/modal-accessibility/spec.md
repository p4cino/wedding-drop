# Spec Delta

## Purpose

Okna modalne są w pełni użyteczne z klawiatury i czytnikiem ekranu, a kamera nie pozostaje włączona po błędzie.

## ADDED Requirements

### Requirement: Fokus pozostaje w otwartym oknie modalnym
Każde okno z `aria-modal="true"` (lightbox, panel dodawania zdjęć, modal eksportu na Dysk Google, modal tworzenia galerii) SHALL zatrzymywać fokus klawiatury wewnątrz okna (Tab i Shift+Tab zapętlają się) oraz po zamknięciu SHALL przywracać fokus na element, który otworzył okno.

#### Scenario: Tab na ostatnim elemencie
- **WHEN** fokus jest na ostatnim fokusowalnym elemencie otwartego modala i użytkownik naciśnie Tab
- **THEN** fokus przechodzi na pierwszy fokusowalny element tego modala

#### Scenario: Zamknięcie modala
- **WHEN** użytkownik zamknie modal
- **THEN** fokus wraca na przycisk, który go otworzył

### Requirement: Zamykanie klawiszem Escape
Każde okno modalne SHALL zamykać się po naciśnięciu Escape, o ile nie trwa operacja blokująca zamknięcie (np. wysyłanie plików lub eksport).

#### Scenario: Escape podczas wysyłania
- **WHEN** trwa wysyłanie plików, a użytkownik naciśnie Escape w panelu dodawania
- **THEN** panel pozostaje otwarty

### Requirement: Kamera jest wyłączana po błędzie
Gdy komponent podglądu kamery przejdzie w stan błędu, strumień kamery SHALL zostać natychmiast zatrzymany (wszystkie ścieżki `stop()`), a nie dopiero po odmontowaniu komponentu.

#### Scenario: Błąd podczas robienia zdjęcia
- **WHEN** przechwycenie klatki zakończy się błędem
- **THEN** wszystkie ścieżki strumienia kamery są zatrzymane, a komponent pokazuje komunikat błędu

### Requirement: Jedno sprawdzenie wsparcia kamery
Aplikacja SHALL używać jednej funkcji do sprawdzenia dostępności `getUserMedia` zarówno przy decyzji o pokazaniu opcji „Zrób zdjęcie", jak i w samym komponencie kamery.

#### Scenario: Brak wsparcia
- **WHEN** przeglądarka nie udostępnia `navigator.mediaDevices.getUserMedia`
- **THEN** opcja robienia zdjęcia nie jest oferowana w panelu dodawania
