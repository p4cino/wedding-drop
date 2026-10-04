# Spec Delta

## Purpose
Określa sposób przechowywania i weryfikacji hasła gościa oraz PIN-u galerii, tak aby wyciek bazy nie ujawniał ich wartości.

## ADDED Requirements

### Requirement: Hasło gościa i PIN są przechowywane jako hash
System SHALL zapisywać hasło gościa i PIN galerii wyłącznie jako hash bcrypt. Plaintext MUST NOT być zapisywany w bazie po zmianie ustawień przez właściciela lub administratora.

#### Scenario: Ustawienie hasła gościa
- **WHEN** właściciel ustawia hasło gościa przez `PATCH /api/owner/{slug}/settings`
- **THEN** wartość zapisana w bazie jest hashem bcrypt, a nie wprowadzonym tekstem

#### Scenario: Utworzenie galerii z PIN-em
- **WHEN** administrator tworzy galerię z `accessPin`
- **THEN** zapisany PIN jest hashem bcrypt

### Requirement: Zgodność wsteczna ze starymi wartościami plaintext
Weryfikacja SHALL akceptować wartości zapisane dawniej jako plaintext, porównując je w stałym czasie, a po poprawnej weryfikacji system SHALL zastąpić je hashem bcrypt.

#### Scenario: Pierwsze logowanie po aktualizacji
- **WHEN** gość podaje poprawne hasło, a w bazie leży plaintext
- **THEN** logowanie się udaje, a wartość w bazie zostaje zamieniona na hash

#### Scenario: Błędne hasło dla starej wartości
- **WHEN** gość podaje błędne hasło, a w bazie leży plaintext
- **THEN** odpowiedź ma status 401, a wartość w bazie pozostaje bez zmian

### Requirement: PIN wyłącznie w nagłówku
PIN dostępu do ZIP SHALL być przyjmowany wyłącznie z nagłówka `x-access-pin`; parametr query `pin` MUST być ignorowany.

#### Scenario: PIN w query
- **WHEN** gość wysyła `GET /api/gallery/{slug}/zip?pin={poprawny}` bez nagłówka
- **THEN** odpowiedź ma status 401

### Requirement: Hasło nie jest zwracane przez API
Żadna odpowiedź API MUST NOT zawierać wartości (ani hasha) hasła gościa ani PIN-u; dozwolone są jedynie flagi `hasPassword` / `hasPin`.

#### Scenario: Panel właściciela
- **WHEN** właściciel pobiera dane panelu
- **THEN** odpowiedź nie zawiera pól `guestPassword` ani `accessPin`
