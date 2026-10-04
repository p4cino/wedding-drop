# Spec Delta

## Purpose
Zapewnia, że galeria chroniona hasłem gościa nie ujawnia mediów, metadanych, życzeń ani nie przyjmuje uploadów bez ważnej sesji gościa.

## ADDED Requirements

### Requirement: Sesja gościa wymagana dla galerii z hasłem
Gdy galeria ma ustawione hasło gościa, następujące operacje SHALL wymagać ważnego ciasteczka sesji gościa (lub poświadczeń właściciela/administratora): `GET /api/gallery/{slug}/media`, `GET` i `POST /api/gallery/{slug}/wishes`, `GET /api/gallery/{slug}/live`, `GET /api/gallery/{slug}/zip` oraz utworzenie uploadu gościa przez TUS. Bez tego system SHALL zwrócić 401.

#### Scenario: Lista mediów bez sesji
- **WHEN** klient bez sesji gościa wysyła `GET /api/gallery/{slug}/media` dla galerii z hasłem
- **THEN** odpowiedź ma status 401 i nie zawiera żadnych metadanych plików

#### Scenario: Życzenia bez sesji
- **WHEN** klient bez sesji gościa wysyła `GET` lub `POST /api/gallery/{slug}/wishes` dla galerii z hasłem
- **THEN** odpowiedź ma status 401 i nie powstaje rekord życzenia

#### Scenario: Upload TUS bez sesji
- **WHEN** klient bez sesji gościa tworzy upload (`source=guest`) w galerii z hasłem
- **THEN** serwer odpowiada 401 i nie tworzy pliku w `tus_temp`

#### Scenario: Strumień SSE bez sesji
- **WHEN** klient bez sesji gościa otwiera `GET /api/gallery/{slug}/live` dla galerii z hasłem
- **THEN** odpowiedź ma status 401

#### Scenario: Galeria bez hasła
- **WHEN** galeria nie ma hasła gościa
- **THEN** powyższe operacje działają jak dotychczas, bez sesji gościa

### Requirement: Życzenia respektują ustawienia galerii
`POST /api/gallery/{slug}/wishes` SHALL odrzucać żądanie statusem 403, gdy galeria ma `allowGuestUploads = false`, oraz statusem 400, gdy jest nieaktywna.

#### Scenario: Wyłączone wgrywanie przez gości
- **WHEN** galeria ma `allowGuestUploads = false` i gość wysyła życzenie
- **THEN** odpowiedź ma status 403

### Requirement: Publiczne metadane galerii są minimalne
`GET /api/gallery/{slug}` bez sesji gościa dla galerii z hasłem MUST zwracać wyłącznie pola potrzebne do ekranu logowania (`slug`, `coupleNames`, `isActive`, `hasPassword`, branding, kolory) i MUST NOT zwracać identyfikatora galerii ani ustawień karteczki.

#### Scenario: Metadane galerii z hasłem
- **WHEN** klient bez sesji pobiera metadane galerii z hasłem gościa
- **THEN** odpowiedź zawiera pole `hasPassword: true` i nie zawiera `id` ani `cardSettings`
