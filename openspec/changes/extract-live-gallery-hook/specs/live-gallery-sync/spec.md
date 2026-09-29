# Spec Delta

## Purpose

Jeden, wspólny mechanizm pobierania i aktualizowania na żywo danych publicznej galerii dla widoków gościa i TV.

## ADDED Requirements

### Requirement: Pojedyncze źródło subskrypcji SSE w kliencie
Klient galerii SHALL tworzyć połączenie `EventSource` do `/api/gallery/[slug]/live` wyłącznie przez wspólny hook `useGalleryEvents`, a każda strona wyświetlająca galerię SHALL utrzymywać co najwyżej jedno takie połączenie.

#### Scenario: Strona galerii gościa i TV używają tego samego hooka
- **WHEN** zostanie zamontowana strona `/g/[slug]` lub `/g/[slug]/tv`
- **THEN** otwiera dokładnie jedno połączenie SSE, a po odmontowaniu je zamyka

### Requirement: Odświeżenie danych po utracie i wznowieniu połączenia
Po zerwaniu, a następnie wznowieniu połączenia SSE klient SHALL ponownie pobrać listę mediów i życzeń, aby nie pozostać w stanie sprzed rozłączenia; dotyczy to także widoku TV.

#### Scenario: TV odzyskuje stan po chwilowej utracie sieci
- **WHEN** połączenie SSE widoku TV zostanie zerwane, a potem wznowione
- **THEN** widok pobiera dane ponownie i pokazuje materiały dodane w czasie rozłączenia

### Requirement: Reducer zdarzeń nie ujawnia ukrytych ani usuniętych treści
Reducer zdarzeń galerii SHALL usuwać z listy element, którego zdarzenie `media-updated` lub `wish-updated` ma status `hidden` lub `deleted`, oraz SHALL ignorować duplikaty tego samego `id`.

#### Scenario: Ukryte zdjęcie znika z widoku gościa
- **WHEN** klient odbierze `media-updated` ze statusem `hidden` dla widocznego zdjęcia
- **THEN** zdjęcie znika z listy bez przeładowania strony

#### Scenario: Duplikat zdarzenia nie dubluje elementu
- **WHEN** klient odbierze dwukrotnie `new-media` z tym samym `id`
- **THEN** lista zawiera element tylko raz

### Requirement: Rozróżnienie stanów ładowania, braku galerii i błędu sieci
Hook SHALL rozróżniać stany `loading`, `ready`, `notFound` (odpowiedź 404) i `error` (błąd sieci lub 5xx), a UI SHALL nie pokazywać komunikatu „galeria nie znaleziona" dla błędu sieci.

#### Scenario: Błąd sieci nie udaje braku galerii
- **WHEN** pobranie danych galerii zakończy się błędem sieci
- **THEN** widok pokazuje stan błędu z możliwością ponowienia, a nie ekran „galeria nie znaleziona"
