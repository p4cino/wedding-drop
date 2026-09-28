# Spec Delta

## Purpose

Umożliwia gościom weselnym wybór i wznawialne przesyłanie zdjęć oraz filmów do galerii bez logowania, z kolejką plików w drawerze, która nie zachęca do ponownego wysłania już przesłanych pozycji.

## ADDED Requirements

### Requirement: Clear upload queue after full success

Po zakończeniu sesji wysyłania, w której każdy plik z bieżącej kolejki zakończył się sukcesem, drawer uploadu gościa MUST natychmiast wyczyścić listę wybranych plików (kolejka jest pusta w UI).

#### Scenario: All files uploaded successfully

- **WHEN** gość uruchomi wysyłanie kolejki zawierającej co najmniej jeden plik
- **AND** każdy plik w tej kolejce zakończy się sukcesem
- **THEN** lista wybranych plików w drawerze MUST być pusta
- **AND** gość MUST móc ponownie wybrać pliki z rolki bez widocznych pozycji z poprzedniej sesji

#### Scenario: Partial failure keeps failed items

- **WHEN** gość uruchomi wysyłanie kolejki z wieloma plikami
- **AND** co najmniej jeden plik zakończy się błędem, a pozostałe sukcesem
- **THEN** drawer MUST NIE czyścić całej kolejki
- **AND** pozycje zakończone błędem MUST pozostać widoczne, aby gość mógł ponowić wysyłanie

### Requirement: Upload queue does not persist across drawer close

Zamknięcie drawera uploadu gościa MUST zresetować kolejkę plików, tak aby kolejne otwarcie startowało z pustą listą.

#### Scenario: Reopen after close with pending files

- **WHEN** gość doda pliki do kolejki, ale nie wyśle ich
- **AND** zamknie drawer (przycisk zamknięcia lub Escape, gdy wysyłanie nie trwa)
- **AND** ponownie otworzy drawer
- **THEN** lista wybranych plików MUST być pusta

#### Scenario: Reopen after successful upload session

- **WHEN** sesja wysyłania zakończy się pełnym sukcesem (kolejka już wyczyszczona)
- **AND** gość zamknie drawer i otworzy go ponownie
- **THEN** lista wybranych plików MUST pozostać pusta
