# Spec Delta

## Purpose

Udostępnia publiczny, tylko-do-odczytu pełnoekranowy widok galerii ślubnej przeznaczony do wyświetlania na telewizorze lub rzutniku w sali weselnej, aktualizowany na żywo w miarę wgrywania nowych zdjęć i filmów przez gości.

## ADDED Requirements

### Requirement: Publiczny, tylko-do-odczytu widok trybu TV
System SHALL udostępniać publiczną trasę pod adresem `/g/{slug}/tv` prezentującą pełnoekranowy pokaz slajdów materiałów danej galerii, bez wymogu logowania.

#### Scenario: Otwarcie trybu TV bez uwierzytelnienia
- **WHEN** dowolna osoba otworzy adres `/g/{slug}/tv` dla istniejącej, aktywnej galerii
- **THEN** system wyświetla pełnoekranowy pokaz slajdów bez proszenia o hasło lub logowanie

#### Scenario: Nieistniejąca galeria
- **WHEN** ktoś otworzy `/g/{slug}/tv` dla sluga, który nie istnieje w systemie
- **THEN** system wyświetla czytelny komunikat "galeria nie istnieje" zamiast pustego pokazu slajdów

### Requirement: Widoczność wyłącznie materiałów o statusie „ready”
Widok trybu TV SHALL prezentować wyłącznie materiały o statusie `ready` i SHALL NOT ujawniać materiałów o statusie `hidden` lub `deleted`, niezależnie od parametrów zapytania.

#### Scenario: Ukryte zdjęcie nie pojawia się w rotacji
- **WHEN** właściciel galerii ukryje zdjęcie w panelu moderacji (`status` zmienia się na `hidden`)
- **THEN** to zdjęcie natychmiast znika z rotacji trybu TV (jeśli było aktualnie wyświetlane) i nie pojawia się w kolejnych cyklach

#### Scenario: Próba wymuszenia widoczności ukrytych materiałów
- **WHEN** ktoś doda do adresu URL trybu TV parametry sugerujące dostęp właściciela (np. token, hasło)
- **THEN** system je ignoruje w tym widoku — tryb TV nigdy nie pokazuje materiałów `hidden`/`deleted`, nawet z poprawnymi poświadczeniami właściciela

### Requirement: Aktualizacja na żywo bez interakcji widza
Widok trybu TV SHALL automatycznie dołączać nowo wgrane materiały do rotacji w czasie rzeczywistym, bez konieczności odświeżania strony przez widza.

#### Scenario: Nowe zdjęcie pojawia się automatycznie
- **WHEN** gość pomyślnie wgra nowe zdjęcie do galerii, której tryb TV jest aktualnie otwarty na ekranie
- **THEN** to zdjęcie dołącza do rotacji pokazu slajdów w ciągu kilku sekund, bez ręcznego odświeżania strony

#### Scenario: Utrata połączenia na żywo
- **WHEN** połączenie strumieniowe (SSE) trybu TV zostanie przerwane (np. chwilowa awaria sieci)
- **THEN** widok automatycznie próbuje wznowić aktualizacje na żywo i w międzyczasie kontynuuje rotację już wczytanych materiałów, zamiast zawiesić się na pustym ekranie

### Requirement: Brak elementów interaktywnych właściwych galerii gościa
Widok trybu TV SHALL NOT udostępniać przycisku dodawania zdjęć, przeglądarki pełnoekranowej sterowanej dotykiem/klawiaturą ani innych elementów nawigacyjnych przeznaczonych do obsługi przez pojedynczego użytkownika.

#### Scenario: Brak przycisku uploadu w trybie TV
- **WHEN** widz patrzy na ekran w trybie TV
- **THEN** na ekranie nie ma pływającego przycisku "Dodaj zdjęcia" ani innych kontrolek przeznaczonych do klikania

### Requirement: Materiały wideo nie odtwarzają dźwięku automatycznie
Gdy w rotacji pojawia się materiał wideo, system SHALL prezentować go bez automatycznego odtwarzania dźwięku (np. jako wyciszony podgląd/klatka), aby nie zakłócać przebiegu wesela nieoczekiwanym dźwiękiem.

#### Scenario: Wideo w rotacji nie generuje dźwięku
- **WHEN** w rotacji pojawia się materiał o typie `video`
- **THEN** ekran TV nie emituje żadnego dźwięku związanego z tym materiałem

### Requirement: Kod QR do dołączenia widoczny na ekranie
Widok trybu TV SHALL wyświetlać stały kod QR prowadzący do publicznej galerii/formularza uploadu tego wesela, widoczny niezależnie od aktualnie prezentowanego materiału.

#### Scenario: Kod QR pozostaje widoczny podczas rotacji
- **WHEN** pokaz slajdów przechodzi między kolejnymi zdjęciami
- **THEN** kod QR prowadzący do galerii pozostaje widoczny w tym samym miejscu ekranu przez cały czas
