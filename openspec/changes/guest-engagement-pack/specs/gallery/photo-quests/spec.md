# Spec Delta

## Purpose

Pozwala Parze Młodej skonfigurować listę foto-wyzwań weselnych („Upoluj kadr” / Bingo), a gościom wybierać wyzwanie podczas wgrywania materiałów oraz przeglądać i filtrować kadry zrealizowane w ramach poszczególnych wyzwań.

## ADDED Requirements

### Requirement: Konfiguracja foto-wyzwań w panelu właściciela galerii
System SHALL umożliwiać uwierzytelnionemu właścicielowi galerii w panelu `/owner/{slug}` włączenie lub wyłączenie funkcji foto-wyzwań oraz zdefiniowanie listy aktywnych wyzwań (z wbudowanych szablonów lub własnych tytułów o długości od 2 do 80 znaków, maksymalnie 20 wyzwań na galerię).

#### Scenario: Włączenie wyzwań i dodanie zadania przez Parę Młodą
- **WHEN** zalogowany właściciel galerii włączy foto-wyzwania, doda wyzwanie „Selfie z Parą Młodą” i zapisze ustawienia
- **THEN** konfiguracja wyzwań zostaje utrwalona w bazie danych, a publiczny endpoint metadanych galerii zwraca aktywną listę wyzwań dla gości

#### Scenario: Próba zapisu konfiguracji wyzwań bez autoryzacji właściciela
- **WHEN** nieuwierzytelniony klient wyśle żądanie zmiany konfiguracji wyzwań
- **THEN** serwer odrzuca żądanie kodem `401 Unauthorized`

### Requirement: Przypisanie wyzwania podczas wznawialnego uploadu TUS
Gdy foto-wyzwania są włączone w galerii, szuflada uploadu (`UploaderDrawer`) SHALL pozwalać gościowi opcjonalnie wybrać jedno z aktywnych wyzwań przed rozpoczęciem wysyłki, a identyfikator wybranego wyzwania (`questId`) SHALL być przekazywany w metadanych protokołu TUS i zapisywany przy utworzonym rekordzie `media_items` (z zachowaniem pełnego przepływu przez ograniczoną kolejkę `p-queue` o współbieżności `2`).

#### Scenario: Wgranie zdjęcia przypisanego do wyzwania
- **WHEN** gość wybierze wyzwanie w szufladzie uploadu i prześle zdjęcie protokołem TUS
- **THEN** po przetworzeniu przez kolejkę `p-queue` nowy materiał w bazie danych oraz w zdarzeniu SSE `new-media` posiada przypisany `questId` odpowiadający wybranemu wyzwaniu

#### Scenario: Przesłanie nieistniejącego lub nieaktywnego `questId`
- **WHEN** w metadanych TUS zostanie przekazany `questId`, który nie figuruje na liście aktywnych wyzwań danej galerii
- **THEN** serwer zapisuje materiał jako zwykłe zdjęcie bez przypisanego wyzwania (`questId: null`), nie przerywając uploadu gościa

### Requirement: Prezentacja odznak wyzwań i filtrowanie w galerii gościa
Gdy w galerii włączone są foto-wyzwania, widok gościa (`/g/{slug}`) SHALL prezentować nad siatką listę wyzwań wraz z liczbą widocznych materiałów (`status: "ready"`) w każdym wyzwaniu, umożliwiać filtrowanie siatki po wybranym wyzwaniu, otwarcie szuflady uploadu z wstępnie wybranym wyzwaniem oraz wyświetlać odznakę tytułu wyzwania na kafelkach siatki i w Lightboxie.

#### Scenario: Filtrowanie galerii po kliknięciu wyzwania
- **WHEN** gość kliknie pigułkę konkretnego wyzwania na pasku wyzwań nad galerią
- **THEN** siatka zdjęć wyświetla wyłącznie widoczne materiały (`status: "ready"`) przypisane do tego `questId`, a ponowne kliknięcie lub wybór „Wszystkie” przywraca pełną listę materiałów

#### Scenario: Ukryte materiały nie wliczają się do postępu wyzwania
- **WHEN** materiał przypisany do wyzwania ma status `hidden`, `pending` lub `deleted`
- **THEN** materiał ten SHALL NOT być wliczany do licznika wykonanych zdjęć wyzwania widocznego dla gości
