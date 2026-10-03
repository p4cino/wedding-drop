# owner-session Specification

## Purpose
Określa, jak Para Młoda uwierzytelnia się w panelu właściciela galerii, jak sesja jest utrzymywana, przywracana i zamykana oraz jak właściciel wykonuje operacje wymagające nawigacji przeglądarki (pobranie ZIP, łączenie z Google Drive) bez ujawniania poświadczeń.

## Requirements

### Requirement: Logowanie ustanawia sesję w ciasteczku HttpOnly
Po poprawnym zalogowaniu hasłem właściciela system SHALL ustawić ciasteczko sesji właściciela przypisane do danej galerii, z atrybutami `HttpOnly`, `SameSite=Strict`, `Path=/api`, czasem życia 7 dni oraz atrybutem `Secure` w środowisku produkcyjnym. Odpowiedź SHALL nadal zawierać `ownerToken` w body JSON.

#### Scenario: Poprawne hasło
- **WHEN** klient wysyła `POST /api/owner/{slug}/auth` z poprawnym hasłem
- **THEN** odpowiedź ma status 200, zawiera `ownerToken` i dane galerii oraz nagłówek `Set-Cookie` z ciasteczkiem sesji tej galerii posiadającym `HttpOnly`, `SameSite=Strict`, `Path=/api` i `Max-Age` równe 7 dniom

#### Scenario: Błędne hasło
- **WHEN** klient wysyła `POST /api/owner/{slug}/auth` z błędnym hasłem
- **THEN** odpowiedź ma status 401 i nie zawiera nagłówka `Set-Cookie` z ciasteczkiem sesji

#### Scenario: Produkcja wymusza Secure
- **WHEN** logowanie odbywa się w środowisku produkcyjnym
- **THEN** ciasteczko sesji posiada atrybut `Secure`

### Requirement: Sesja jest izolowana per galeria
Ciasteczko sesji wydane dla jednej galerii MUST NOT autoryzować żadnej operacji w innej galerii.

#### Scenario: Ciasteczko innej galerii
- **WHEN** przeglądarka posiada ważne ciasteczko sesji galerii `a` i wysyła `GET /api/owner/b/session`
- **THEN** odpowiedź ma status 401

### Requirement: Przywracanie sesji bez hasła
System SHALL udostępniać `GET /api/owner/{slug}/session`, które przy ważnym ciasteczku sesji zwraca te same dane co logowanie (galeria, statystyki, stan Google Drive) oraz świeży `ownerToken`, bez ponownego podawania hasła.

#### Scenario: Ważne ciasteczko
- **WHEN** przeglądarka z ważnym ciasteczkiem sesji galerii wysyła `GET /api/owner/{slug}/session`
- **THEN** odpowiedź ma status 200 i zawiera `ownerToken`, `gallery` i `stats`

#### Scenario: Brak lub wygasłe ciasteczko
- **WHEN** żądanie `GET /api/owner/{slug}/session` nie zawiera ciasteczka sesji albo zawiera ciasteczko starsze niż 7 dni lub z niepoprawnym podpisem
- **THEN** odpowiedź ma status 401

#### Scenario: Odświeżenie panelu
- **WHEN** zalogowany właściciel odświeża stronę panelu `/owner/{slug}`
- **THEN** panel odtwarza zalogowany widok bez wyświetlania formularza hasła

### Requirement: Wylogowanie zamyka sesję
System SHALL udostępniać `DELETE /api/owner/{slug}/session`, które usuwa ciasteczko sesji danej galerii.

#### Scenario: Wylogowanie
- **WHEN** klient wysyła `DELETE /api/owner/{slug}/session`
- **THEN** odpowiedź zawiera `Set-Cookie` wygaszające ciasteczko sesji tej galerii, a kolejne `GET /api/owner/{slug}/session` zwraca 401

### Requirement: Ciasteczko autoryzuje wyłącznie metody bezpieczne
Ciasteczko sesji właściciela SHALL autoryzować wyłącznie żądania `GET` i `HEAD`. Żądania modyfikujące (`POST`, `PATCH`, `PUT`, `DELETE`) do endpointów właściciela MUST wymagać tokenu właściciela przekazanego nagłówkiem lub w body JSON; samo ciasteczko MUST NOT wystarczać.

#### Scenario: Mutacja tylko z ciasteczkiem
- **WHEN** przeglądarka z ważnym ciasteczkiem sesji wysyła `DELETE /api/owner/{slug}/media/{id}` bez nagłówka `x-owner-token` i bez tokenu w body
- **THEN** odpowiedź ma status 401, a plik nie zostaje usunięty

#### Scenario: Mutacja z nagłówkiem
- **WHEN** klient wysyła `PATCH /api/owner/{slug}/media/{id}/status` z poprawnym nagłówkiem `x-owner-token`
- **THEN** status pliku zostaje zmieniony

### Requirement: Właściciel pobiera pełne archiwum ZIP bez tokenu w URL
`GET /api/gallery/{slug}/zip` SHALL rozpoznawać właściciela po ważnym ciasteczku sesji lub nagłówku `x-owner-token` i dla właściciela dołączać pliki o statusie `ready` i `hidden` (bez `deleted`), niezależnie od ustawienia pobierania przez gości i kodu PIN. Link pobierania w panelu MUST NOT zawierać tokenu ani hasła.

#### Scenario: Pobranie przez właściciela z ciasteczkiem
- **WHEN** przeglądarka z ważnym ciasteczkiem sesji galerii, w której wyłączono pobieranie przez gości, wysyła `GET /api/gallery/{slug}/zip`
- **THEN** odpowiedź ma status 200 i archiwum zawiera także pliki ukryte

#### Scenario: Link w panelu
- **WHEN** panel właściciela renderuje przycisk „Pobierz ZIP”
- **THEN** atrybut `href` ma postać `/api/gallery/{slug}/zip` bez parametrów zawierających poświadczenia

#### Scenario: Gość bez sesji
- **WHEN** żądanie bez ciasteczka sesji i bez nagłówka właściciela trafia do `GET /api/gallery/{slug}/zip`
- **THEN** obowiązują reguły dla gościa: tylko pliki `ready`, `403` przy wyłączonych pobieraniach, `401` przy błędnym PIN

### Requirement: Łączenie z Google Drive bez poświadczeń w URL
System SHALL inicjować łączenie konta Google Drive przez `POST /api/auth/google` ze slugiem w body JSON, autoryzowane tokenem właściciela w nagłówku lub hasłem w nagłówku `x-owner-password`. Odpowiedź SHALL zawierać `authUrl` do przekierowania. Żądanie `GET /api/auth/google` MUST NOT inicjować przepływu OAuth.

#### Scenario: Poprawna autoryzacja
- **WHEN** klient wysyła `POST /api/auth/google` z body `{ "slug": "{slug}" }` i poprawnym nagłówkiem `x-owner-token`
- **THEN** odpowiedź ma status 200 i zawiera `authUrl` wskazujący na serwer autoryzacji Google z podpisanym parametrem `state`

#### Scenario: Brak autoryzacji
- **WHEN** klient wysyła `POST /api/auth/google` bez tokenu i bez hasła lub z niepoprawnymi poświadczeniami
- **THEN** odpowiedź ma status 401 i nie zawiera `authUrl`

#### Scenario: Stara metoda GET
- **WHEN** klient wysyła `GET /api/auth/google?slug={slug}&token={token}`
- **THEN** odpowiedź ma status 405 i nie następuje przekierowanie do Google
