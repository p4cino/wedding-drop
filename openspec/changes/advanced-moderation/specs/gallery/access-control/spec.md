# Spec Delta

## Purpose
Zarządzanie dostępem gości do galerii weselnej, w tym ochrona hasłem oraz precyzyjna kontrola nad uprawnieniami do przeglądania i wgrywania materiałów.

## ADDED Requirements

### Requirement: Ochrona galerii hasłem
Gdy opcja jest włączona, system MUST wymagać poprawnego podania hasła przez gościa przed udostępnieniem jakiejkolwiek treści (metadanych, zdjęć, plików wideo) z galerii.

#### Scenario: Odmowa dostępu bez hasła
- **WHEN** gość próbuje otworzyć galerię z włączoną ochroną hasłem
- **THEN** system zwraca żądanie autoryzacji (ekran logowania) i nie udostępnia zawartości galerii

#### Scenario: Udany dostęp z hasłem
- **WHEN** gość wpisze poprawne hasło
- **THEN** system zapisuje sesję gościa i udostępnia pełny dostęp do galerii

### Requirement: Kontrola uprawnień gości
System MUST egzekwować flagi uprawnień ustawione przez właściciela galerii, blokując operacje uploadu, pobierania lub przeglądania w zależności od bieżących ustawień.

#### Scenario: Zablokowany upload
- **WHEN** gość próbuje przesłać plik do galerii, a `allowGuestUploads` wynosi false
- **THEN** system odrzuca żądanie i ukrywa przycisk uploadu w interfejsie

#### Scenario: Brak dostępu do przeglądania plików
- **WHEN** opcja wyświetlania siatki zdjęć jest zablokowana (np. link tylko do wgrywania)
- **THEN** gość widzi jedynie ekran umożliwiający upload, a endpoint pobierający pliki zwraca błąd dostępu
