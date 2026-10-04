# Spec Delta

## Purpose
Ten moduł obsługuje bezpośrednie otwieranie systemowego aparatu fotograficznego (natywnej aplikacji kamery na iOS/Android) oraz aplikacji galerii podczas dodawania zdjęć, rezygnując z rozwiązań webowych (WebRTC).

## ADDED Requirements

### Requirement: Przycisk uruchomienia aparatu
The system SHALL trigger the native OS camera interface directly when the user requests to take a photo.

#### Scenario: Użytkownik wybiera zrobienie zdjęcia
- **WHEN** user clicks the "Zrób zdjęcie" (Take photo) button
- **THEN** system otwiera natywny aparat używając inputu z atrybutem capture="environment"
- **THEN** plik ze zdjęcia trafia bezpośrednio do procesu wysyłania (TUS) bez dodatkowego podglądu w aplikacji webowej

### Requirement: Przycisk wyboru z galerii
The system SHALL trigger the native OS file/gallery picker when the user requests to upload an existing photo or video.

#### Scenario: Użytkownik wybiera opcję dodania z galerii
- **WHEN** user clicks the "Wybierz z urządzenia" (Choose from device) button
- **THEN** system otwiera natywną galerię używając standardowego inputu bez atrybutu capture
- **THEN** wybrane pliki trafiają do kolejki procesora TUS
