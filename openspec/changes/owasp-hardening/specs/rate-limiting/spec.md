# Spec Delta

## Purpose
Ogranicza liczbę prób uwierzytelnienia i kosztownych żądań z jednego źródła, aby uniemożliwić brute-force haseł oraz wyczerpanie CPU urządzenia N100 przez bcrypt.

## ADDED Requirements

### Requirement: Limit prób logowania i weryfikacji haseł
System SHALL ograniczać liczbę prób w oknie czasowym, liczoną osobno dla pary adres IP + zasób (slug galerii albo `admin`), dla: logowania administratora, logowania właściciela, hasła gościa, PIN-u ZIP oraz każdego żądania używającego nagłówka `x-owner-password`. Po przekroczeniu limitu system MUST odpowiedzieć statusem 429 z nagłówkiem `Retry-After` i MUST NOT wykonywać porównania hasła (bcrypt).

#### Scenario: Przekroczenie limitu logowania właściciela
- **WHEN** ten sam adres IP wysyła więcej niż 10 nieudanych `POST /api/owner/{slug}/auth` w ciągu 15 minut
- **THEN** kolejne żądanie dostaje 429 z `Retry-After`, nawet gdy podane hasło jest poprawne

#### Scenario: Limit nie dotyczy innej galerii
- **WHEN** adres IP wyczerpał limit dla galerii `a`
- **THEN** logowanie do galerii `b` z tego samego IP jest nadal obsługiwane

#### Scenario: Poprawne logowanie czyści licznik
- **WHEN** logowanie zakończy się sukcesem przed osiągnięciem limitu
- **THEN** licznik nieudanych prób dla tej pary IP + zasób jest zerowany

#### Scenario: Hasło w nagłówku bez uwierzytelnienia
- **WHEN** adres IP wysyła ponad limit żądań z błędnym `x-owner-password` do `/api/gallery/{slug}/media`
- **THEN** kolejne żądania dostają 429 bez wywołania bcrypt

### Requirement: Limit żądań anonimowych modyfikujących dane
System SHALL ograniczać `POST /api/gallery/{slug}/wishes` do 30 żądań na IP na galerię na minutę oraz tworzenie uploadów TUS przez gości (`POST /api/upload/tus`, `source=guest`) do 300 żądań na IP na galerię na minutę, odpowiadając 429 po przekroczeniu. Import fotografa (wymagający tokenu właściciela) nie podlega limitowi tworzenia uploadów.

#### Scenario: Spam życzeń
- **WHEN** jeden IP wysyła 31 `POST /wishes` w minutę
- **THEN** 31. żądanie dostaje 429 i nie tworzy rekordu

### Requirement: Źródło adresu IP
System SHALL ustalać adres klienta z `X-Forwarded-For` ustawianego przez zaufany reverse proxy (Caddy), a gdy nagłówka brak, z adresu gniazda. Pamięć limitera MUST mieć górną granicę liczby kluczy i usuwać wygasłe wpisy.

#### Scenario: Ograniczona pamięć
- **WHEN** limiter zbiera wpisy z bardzo wielu różnych adresów
- **THEN** liczba przechowywanych kluczy nie przekracza ustalonego maksimum, a najstarsze wygasłe wpisy są usuwane
