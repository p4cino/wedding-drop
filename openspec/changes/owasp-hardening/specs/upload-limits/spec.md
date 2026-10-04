# Spec Delta

## Purpose
Chroni dysk i zasoby serwera przed anonimowym wyczerpaniem przestrzeni przez uploady plików.

## ADDED Requirements

### Requirement: Maksymalny rozmiar pliku 1 GiB
Serwer uploadu SHALL odrzucać każdy upload (gościa i fotografa) o deklarowanym lub faktycznym rozmiarze większym niż 1 GiB (1 073 741 824 bajtów) statusem 413, bez zapisywania danych ponad limit.

#### Scenario: Plik większy niż limit
- **WHEN** klient tworzy upload z `Upload-Length` równym 1 GiB + 1 bajt
- **THEN** odpowiedź ma status 413 i nie powstaje plik w `tus_temp`

#### Scenario: Plik równy limitowi
- **WHEN** klient tworzy upload o rozmiarze dokładnie 1 GiB
- **THEN** upload jest przyjęty

#### Scenario: Upload bez zadeklarowanego rozmiaru
- **WHEN** klient tworzy upload bez deklaracji rozmiaru
- **THEN** odpowiedź ma status 4xx i upload nie jest tworzony

### Requirement: Limit pojemności galerii dotyczy także gości
Gdy galeria ma `maxStorageBytes` większe od 0, upload gościa, który przekroczyłby limit łącznego rozmiaru plików galerii, SHALL zostać odrzucony statusem 413. Wartość 0 oznacza brak limitu.

#### Scenario: Gość przekracza limit galerii
- **WHEN** suma rozmiarów plików galerii plus rozmiar nowego pliku przekracza `maxStorageBytes`
- **THEN** upload gościa jest odrzucony statusem 413

### Requirement: Sprzątanie osieroconych uploadów
System SHALL usuwać z `tus_temp` niedokończone uploady starsze niż 24 godziny.

#### Scenario: Porzucony upload
- **WHEN** upload nie był wznawiany przez ponad 24 godziny
- **THEN** jego pliki w `tus_temp` zostają usunięte przy najbliższym sprzątaniu
