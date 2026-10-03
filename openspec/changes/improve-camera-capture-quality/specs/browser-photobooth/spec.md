# Spec Delta

## Purpose

Zwiększenie rozdzielczości, ostrości i jakości zdjęć wykonywanych w aparacie przeglądarki (`browser-photobooth`) poprzez negocjację strumienia w jakości Full HD/4K, ciągły autofokus oraz integrację z API `ImageCapture`.

## ADDED Requirements

### Requirement: Przechwytywanie zdjęć matrycą aparatu (ImageCapture API)
System SHALL wykorzystywać natywne API `ImageCapture` do wykonywania zdjęć w pełnej rozdzielczości matrycy aparatu z natywnym przetwarzaniem obrazu, jeśli przeglądarka i urządzenie oferują to API.

#### Scenario: Urządzenie ze wsparciem ImageCapture
- **GIVEN** gość uruchomił aparat w przeglądarce wspierającej `ImageCapture`
- **WHEN** gość naciśnie spust migawki
- **THEN** system wykonuje zdjęcie za pośrednictwem `takePhoto()` na aktywnej ścieżce wideo
- **AND** nanosi ozdobną ramkę motywu wesela na uzyskaną pełnowymiarową klatkę przed wysyłką

#### Scenario: Fallback przy braku ImageCapture lub błędzie sensora
- **GIVEN** przeglądarka nie implementuje API `ImageCapture` (np. iOS Safari) lub `takePhoto()` zakończy się błędem
- **WHEN** gość naciśnie spust migawki
- **THEN** system bez przerywania działania wykonuje zrzut z wysokorozdzielczego elementu `<video>`
- **AND** pomyślnie generuje plik z ramką weselną

## MODIFIED Requirements

### Requirement: Uruchomienie aparatu w przeglądarce z poziomu drawera uploadu
System SHALL żądać strumienia wideo o wysokiej rozdzielczości (`width: { ideal: 1920 }`, `height: { ideal: 1080 }`) oraz włączać ciągły autofokus (`focusMode: "continuous"`), jeśli aparat to umożliwia.

#### Scenario: Negocjacja parametrów sensora
- **WHEN** gość otworzy podgląd aparatu
- **THEN** system wnioskuje o strumień wideo o docelowej rozdzielczości Full HD i ciągłym trybie ostrości z zachowaniem tolerancyjnych ograniczeń (`ideal`)
- **AND** urządzenie z niższą natywną rozdzielczością nie rzuca błędu, lecz dostarcza najlepszy dostępny tryb wideo
