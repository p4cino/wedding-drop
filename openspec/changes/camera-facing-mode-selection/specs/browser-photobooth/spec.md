# Spec Delta

## Purpose

Rozszerzenie funkcji aparatu w przeglądarce (`browser-photobooth`) o możliwość wyboru i przełączania między przednim (selfie) a tylnym (otoczenie) aparatem urządzenia oraz bezpieczną negocjację strumienia wideo.

## ADDED Requirements

### Requirement: Przełączanie między przednim a tylnym aparatem urządzenia
System SHALL umożliwiać gościowi przełączanie strumienia wideo między przednią kamerą (`user`) a tylną kamerą (`environment`), o ile urządzenie posiada więcej niż jedną kamerę wideo.

#### Scenario: Gość przełącza aparat
- **GIVEN** podgląd aparatu jest uruchomiony na urządzeniu z co najmniej dwoma kamerami
- **WHEN** gość kliknie przycisk przełączenia aparatu
- **THEN** system zwalnia dotychczasowy strumień kamery i uruchamia strumień z przeciwnej kamery (`user` <-> `environment`)
- **AND** obraz podglądu jest poprawnie dostosowany (odbicie lustrzane wyłącznie dla kamery przedniej)

#### Scenario: Urządzenie z pojedynczą kamerą
- **GIVEN** urządzenie posiada tylko jedną kamerę wideo (np. kamera wbudowana w laptop)
- **WHEN** podgląd aparatu zostanie uruchomiony
- **THEN** przycisk przełączenia aparatu nie jest wyświetlany
- **AND** strumień wideo uruchamia się bez błędów typu `OverconstrainedError` dzięki elastycznemu dopasowaniu ograniczeń (`ideal`)

#### Scenario: Zapamiętywanie ostatnio używanego trybu
- **GIVEN** gość przełączył aparat na kamerę tylną lub przednią
- **WHEN** gość zamknie podgląd i otworzy go ponownie w tej samej przeglądarce
- **THEN** system domyślnie próbuje uruchomić ostatnio wybrany tryb kamery zapisany w pamięci podręcznej przeglądarki

## MODIFIED Requirements

### Requirement: Uruchomienie aparatu w przeglądarce z poziomu drawera uploadu
System SHALL udostępniać w drawerze uploadu opcję uruchomienia podglądu na żywo z kamery urządzenia gościa z elastycznym dopasowaniem orientacji (`facingMode: { ideal: ... }`).

#### Scenario: Uruchomienie podglądu kamery
- **WHEN** gość wybierze opcję "Zrób zdjęcie" w drawerze uploadu
- **THEN** system żąda dostępu do kamery z orientacją domyślną (tylna lub zapamiętana) za pomocą ograniczenia `ideal`, zapobiegając błędom blokującym na urządzeniach z jedną kamerą
