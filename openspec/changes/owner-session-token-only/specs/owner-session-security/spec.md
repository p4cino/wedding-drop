# Spec Delta

## Purpose

Sesja właściciela galerii nie wymaga przechowywania hasła w przeglądarce.

## ADDED Requirements

### Requirement: Hasło właściciela nie jest przechowywane w przeglądarce
Klient SHALL NOT zapisywać hasła właściciela w `sessionStorage`, `localStorage`, ciasteczkach ani żadnym innym trwałym magazynie przeglądarki, a przy ładowaniu panelu SHALL usunąć ewentualny klucz `owner_pwd_<slug>` pozostały z poprzedniej wersji.

#### Scenario: Po zalogowaniu w magazynie nie ma hasła
- **WHEN** właściciel zaloguje się poprawnym hasłem
- **THEN** w `sessionStorage` znajduje się token właściciela, ale nie ma żadnego wpisu zawierającego hasło

#### Scenario: Sprzątanie starego klucza
- **WHEN** panel ładuje się w przeglądarce, w której istnieje klucz `owner_pwd_<slug>`
- **THEN** klucz zostaje usunięty

### Requirement: Odtworzenie sesji na podstawie tokenu
System SHALL udostępniać `GET /api/owner/[slug]/session` autoryzowane tokenem właściciela, zwracające ten sam ładunek danych panelu co logowanie, bez wydawania nowego tokenu.

#### Scenario: Odświeżenie strony panelu
- **WHEN** zalogowany właściciel odświeży stronę panelu, a token jest ważny
- **THEN** panel odtwarza dane bez ponownego podawania hasła

#### Scenario: Brak lub nieważny token
- **WHEN** żądanie do endpointu sesji nie zawiera ważnego tokenu dla tej galerii
- **THEN** system zwraca 401, a klient usuwa zapisany token i pokazuje formularz logowania

#### Scenario: Nieistniejąca galeria
- **WHEN** żądanie dotyczy slugu nieistniejącej galerii
- **THEN** system zwraca 404

### Requirement: Weryfikacja tokenu odporna na ataki czasowe
Weryfikacja tokenu w endpoincie sesji SHALL używać istniejącej weryfikacji HMAC z porównaniem stałoczasowym (`crypto.timingSafeEqual` na buforach równej długości) i SHALL odrzucać token wystawiony dla innego slugu.

#### Scenario: Token innej galerii
- **WHEN** żądanie zawiera prawidłowy token właściciela innej galerii
- **THEN** system zwraca 401
