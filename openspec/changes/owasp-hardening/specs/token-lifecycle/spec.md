# Spec Delta

## Purpose
Zapewnia możliwość unieważnienia tokenów administratora i właściciela oraz ogranicza ich czas życia i informacje ujawniane przy logowaniu.

## ADDED Requirements

### Requirement: Tokeny mają unikalny identyfikator i ograniczony czas życia
Tokeny administratora i właściciela SHALL zawierać losowy identyfikator (`jti`) objęty podpisem. Token administratora SHALL być ważny 8 godzin, token właściciela 7 dni.

#### Scenario: Wygasły token administratora
- **WHEN** klient używa tokenu administratora starszego niż 8 godzin
- **THEN** odpowiedź ma status 401

#### Scenario: Token bez identyfikatora
- **WHEN** klient używa tokenu w dawnym formacie (bez `jti`)
- **THEN** odpowiedź ma status 401

### Requirement: Wylogowanie unieważnia token
System SHALL udostępniać wylogowanie administratora (`POST /api/admin/auth/logout`) oraz rozszerzyć `DELETE /api/owner/{slug}/session` tak, aby `jti` przekazanego tokenu trafiał na listę unieważnionych do czasu jego wygaśnięcia. Unieważniony token MUST być odrzucany przez wszystkie endpointy, włącznie z `/media-file/*` i TUS.

#### Scenario: Użycie tokenu po wylogowaniu administratora
- **WHEN** administrator wylogowuje się, a następnie wysyła `GET /api/admin/galleries` z tym samym tokenem
- **THEN** odpowiedź ma status 401

#### Scenario: Wylogowanie właściciela
- **WHEN** właściciel wywołuje `DELETE /api/owner/{slug}/session` z nagłówkiem `x-owner-token`
- **THEN** ten token jest od tej chwili odrzucany z kodem 401

### Requirement: Jednolity błąd logowania administratora
Logowanie administratora SHALL zwracać identyczny status i komunikat zarówno dla nieistniejącego użytkownika, jak i błędnego hasła, oraz zbliżony czas odpowiedzi.

#### Scenario: Nieistniejący użytkownik
- **WHEN** klient loguje się nieistniejącym loginem
- **THEN** odpowiedź to 401 z komunikatem identycznym jak dla błędnego hasła istniejącego użytkownika
