# Spec Delta

## Purpose

Określa dopuszczalne kanały przekazywania poświadczeń (haseł właściciela, tokenów właściciela i administratora) między klientem a API, tak aby nie trafiały do adresów URL, logów, historii przeglądarki ani trwałej pamięci przeglądarki.

## ADDED Requirements

### Requirement: Poświadczenia nie są akceptowane z query stringu
API MUST ignorować poświadczenia przekazane w query stringu, w szczególności parametry `password`, `token`, `ownerToken` i `adminToken`. Żądanie, którego jedynym poświadczeniem jest parametr query, SHALL być traktowane jak nieuwierzytelnione.

#### Scenario: Hasło w query dla ukrytych mediów
- **WHEN** klient wysyła `GET /api/gallery/{slug}/media?includeHidden=true&password={poprawne-hasło}` bez nagłówków uwierzytelniających
- **THEN** odpowiedź ma status 401

#### Scenario: Token administratora w query
- **WHEN** klient wysyła `GET /api/gallery/{slug}/media?includeHidden=true&adminToken={ważny-token}` bez nagłówków uwierzytelniających
- **THEN** odpowiedź ma status 401

#### Scenario: Hasło w query dla ZIP
- **WHEN** klient wysyła `GET /api/gallery/{slug}/zip?password={poprawne-hasło}` bez nagłówków i bez ciasteczka sesji
- **THEN** żądanie jest obsługiwane według reguł dla gościa i archiwum nie zawiera plików ukrytych

#### Scenario: Token właściciela w query
- **WHEN** klient wysyła żądanie do endpointu właściciela z `?token={ważny-token}` i bez innych poświadczeń
- **THEN** odpowiedź ma status 401

#### Scenario: Token administratora w query dla panelu admina
- **WHEN** klient wysyła `GET /api/admin/galleries?token={ważny-token}` bez nagłówka `x-admin-token` i bez `Authorization`
- **THEN** odpowiedź ma status 401

### Requirement: Dozwolone kanały poświadczeń
API SHALL akceptować poświadczenia wyłącznie z nagłówków (`x-owner-token`, `x-owner-password`, `x-admin-token`, `Authorization: Bearer`), z body JSON żądań modyfikujących lub z ciasteczka sesji właściciela w zakresie określonym przez capability `owner-session`.

#### Scenario: Nagłówek hasła właściciela
- **WHEN** klient wysyła `GET /api/gallery/{slug}/media?includeHidden=true` z poprawnym nagłówkiem `x-owner-password`
- **THEN** odpowiedź ma status 200 i zawiera pliki ukryte

#### Scenario: Nagłówek Authorization dla administratora
- **WHEN** klient wysyła `GET /api/gallery/{slug}/media?includeHidden=true` z nagłówkiem `Authorization: Bearer {ważny-token-admina}`
- **THEN** odpowiedź ma status 200 i zawiera pliki ukryte

### Requirement: Panel nie utrwala poświadczeń w pamięci przeglądarki
Interfejs panelu właściciela MUST NOT zapisywać hasła właściciela ani tokenu właściciela w `sessionStorage`, `localStorage`, IndexedDB ani w ciasteczkach dostępnych dla JavaScriptu. Token właściciela SHALL być przechowywany wyłącznie w pamięci bieżącej strony.

#### Scenario: Po zalogowaniu
- **WHEN** właściciel loguje się w panelu `/owner/{slug}`
- **THEN** ani `sessionStorage`, ani `localStorage` nie zawiera hasła ani tokenu właściciela

#### Scenario: Pozostałości po starej wersji
- **WHEN** panel ładuje się w przeglądarce zawierającej klucze `owner_pwd_{slug}` lub `owner_token_{slug}` w `sessionStorage` z poprzedniej wersji aplikacji
- **THEN** panel usuwa te klucze i nie używa ich do logowania

### Requirement: Nawigacje przeglądarki nie zawierają poświadczeń
Adresy URL generowane przez interfejs do nawigacji przeglądarki (linki, przekierowania `window.location`) MUST NOT zawierać haseł ani tokenów.

#### Scenario: Łączenie Google Drive
- **WHEN** właściciel klika „Połącz z Dyskiem Google”
- **THEN** przeglądarka nawiguje bezpośrednio do adresu `authUrl` zwróconego przez API, a żaden adres URL w historii nie zawiera tokenu właściciela ani hasła
