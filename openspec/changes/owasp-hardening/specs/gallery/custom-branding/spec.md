# Spec Delta

## ADDED Requirements

### Requirement: Bezpieczny zapis plików brandingu
System SHALL akceptować jako logo i tło wyłącznie obrazy JPEG, PNG i WebP, rozpoznane po zawartości (magic bytes), a nie po deklarowanym typie lub nazwie pliku. Format SVG MUST być odrzucany. Nazwa i rozszerzenie pliku na dysku SHALL być wyznaczane przez system i MUST NOT zawierać żadnego fragmentu nazwy podanej przez klienta; zapisany plik MUST zawsze leżeć w katalogu brandingu danej galerii.

#### Scenario: Próba path traversal w nazwie pliku
- **WHEN** właściciel wysyła plik z nazwą zawierającą `../` lub separatory ścieżki w części rozszerzenia
- **THEN** plik (jeśli jest poprawnym obrazem) zostaje zapisany pod nazwą wygenerowaną przez system w katalogu brandingu, a żaden plik nie powstaje poza nim

#### Scenario: Przesłanie SVG
- **WHEN** właściciel wysyła plik SVG jako logo lub tło
- **THEN** odpowiedź ma status 400

#### Scenario: Fałszywy typ MIME
- **WHEN** właściciel wysyła plik HTML z deklarowanym typem `image/png`
- **THEN** odpowiedź ma status 400, a plik nie jest zapisywany

### Requirement: Bezpieczne serwowanie plików brandingu
Odpowiedzi `/branding-file/*` SHALL zawierać `X-Content-Type-Options: nosniff` oraz `Content-Security-Policy: default-src 'none'; sandbox`.

#### Scenario: Nagłówki odpowiedzi
- **WHEN** klient pobiera `/branding-file/{slug}/{plik}`
- **THEN** odpowiedź zawiera oba nagłówki
