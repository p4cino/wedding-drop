# Spec Delta

## Purpose
Moderacja przesyłanych materiałów poprzez kolejkę akceptacji, zapobiegająca automatycznemu udostępnianiu niezweryfikowanych treści wszystkim gościom.

## ADDED Requirements

### Requirement: Kolejka akceptacji dla uploadów
Gdy kolejka akceptacji jest włączona (`isApprovalQueueEnabled`), każdy nowy plik przesłany przez gościa MUST trafiać do bazy z domyślnym statusem `pending` (oczekujący) zamiast `visible`.

#### Scenario: Upload przy włączonej kolejce
- **WHEN** gość przesyła zdjęcie, a kolejka akceptacji jest włączona
- **THEN** zdjęcie zapisuje się ze statusem `pending` i jest niewidoczne w siatce zdjęć gości

#### Scenario: Upload przy wyłączonej kolejce
- **WHEN** gość przesyła zdjęcie, a kolejka akceptacji jest wyłączona
- **THEN** zdjęcie zapisuje się ze statusem `visible` i natychmiast pojawia się w galerii gości

### Requirement: Widoczność plików oczekujących
Pliki w statusie `pending` (oczekujące) MUST być widoczne wyłącznie w panelu właściciela galerii, a próba ich bezpośredniego odczytu przez gości bez autoryzacji właściciela MUST skutkować błędem dostępu.

#### Scenario: Zabezpieczenie na poziomie handlerów plików
- **WHEN** niezalogowany jako właściciel gość odpytuje o plik ze statusem `pending` w endpointach serwujących media
- **THEN** system zwraca błąd 403 Forbidden (podobnie jak dla plików `hidden`)

### Requirement: Zatwierdzanie plików przez właściciela
Właściciel galerii SHALL mieć możliwość przejścia przez oczekujące materiały i zmiany ich statusu na `visible` lub ich usunięcia/ukrycia w panelu administracyjnym.

#### Scenario: Zatwierdzenie zdjęcia
- **WHEN** właściciel klika "Zatwierdź" przy zdjęciu w kolejce
- **THEN** status zdjęcia zmienia się na `visible` i staje się ono dostępne publicznie w galerii
