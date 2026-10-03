# Spec Delta

## Purpose

System wzornictwa i komponentów interfejsu WeddingDrop dostarcza spójne tokeny stylistyczne motywu ślubnego oraz dostępne komponenty bazowe oparte na Park UI, generowane bez narzutu w czasie działania aplikacji.

## ADDED Requirements

### Requirement: Spójne semantyczne tokeny motywu ślubnego
System SHALL udostępniać semantyczne tokeny stylów dla palety ślubnej (w tym barwy szampana, złota, różu, grafitu i szmaragdu) oraz hierarchii typograficznej, gwarantując spójną estetykę i odpowiedni kontrast we wszystkich widokach gościa i administratora.

#### Scenario: Stosowanie akcentów kolorystycznych
- **WHEN** komponent interfejsu (np. przycisk lub nagłówek) odwołuje się do tokenu akcentu ślubnego
- **THEN** wyrenderowany element stosuje zdefiniowaną wartość koloru bez rozbieżności między widokami

### Requirement: Dostępność klawiatury i WAI-ARIA w oknach dialogowych i szufladach
Komponenty nakładkowe (modale dialogowe, podgląd Lightbox oraz szuflada wgrywania plików) SHALL implementować standardy WAI-ARIA, w tym pułapkę fokusu wewnątrz otwartego panelu, zamykanie klawiszem Escape oraz blokadę przewijania zawartości podkładowej.

#### Scenario: Zamknięcie okna modalnego klawiszem Escape
- **WHEN** użytkownik naciska klawisz Escape przy otwartym oknie dialogowym lub podglądzie
- **THEN** modal zostaje natychmiast zamknięty, a fokus powraca do elementu wyzwalającego

#### Scenario: Przeniesienie fokusu w szufladzie uploadera
- **WHEN** szuflada uploadera zostaje otwarta
- **THEN** fokus jest automatycznie przenoszony do pierwszego interaktywnego elementu w szufladzie, a tabulacja nie opuszcza obszaru szuflady

### Requirement: Wyraźny wskaźnik skupienia dla elementów interaktywnych
Wszystkie interaktywne kontrolki systemu interfejsu (przyciski, linki, przełączniki i pola wejściowe) SHALL prezentować wyraźny wskaźnik skupienia (`focus-visible`) zgodny z kryterium WCAG 2.4.7.

#### Scenario: Nawigacja klawiaturą po przyciskach akcji
- **WHEN** użytkownik porusza się po interfejsie za pomocą klawisza Tab
- **THEN** każdy zaznaczony element posiada widoczne, kontrastowe obramowanie wskaźnika skupienia

### Requirement: Respektowanie preferencji ograniczenia ruchu
Wszystkie animowane elementy interfejsu (animacje otwierania szuflad, modali, toastów oraz przejścia w galerii) SHALL automatycznie redukować czas trwania animacji do wartości pomijalnej w przypadku włączonej preferencji `prefers-reduced-motion: reduce`.

#### Scenario: Otwarcie szuflady przy preferencji ograniczonego ruchu
- **WHEN** w systemie operacyjnym włączona jest opcja ograniczenia ruchu
- **THEN** szuflada i toasty pojawiają się natychmiast bez animacji przesunięcia lub zanikania

### Requirement: Ekstrakcja stylów w czasie kompilacji bez narzutu runtime
System stylizacji SHALL kompilować wszystkie klasy i warianty do czystego, statycznego arkusza CSS podczas budowy projektu (zero-runtime CSS extraction), nie uruchamiając kalkulacji stylów w wątku wykonawczym przeglądarki ani serwera.

#### Scenario: Ładowanie strony w przeglądarce
- **WHEN** przeglądarka pobiera i renderuje stronę aplikacji
- **THEN** wszystkie style są aplikowane za pomocą statycznego arkusza stylów bez biblioteki obliczającej reguły CSS w runtime
