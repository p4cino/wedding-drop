# Spec Delta

## Purpose

Pozwala właścicielowi galerii masowo zaimportować materiały od profesjonalnego fotografa/kamerzysty do tej samej galerii i chronologii co uploady gości, z wizualnym oznaczeniem źródła, bez omijania istniejących ograniczeń przetwarzania i pojemności dysku.

## ADDED Requirements

### Requirement: Import materiałów fotografa wymaga autoryzacji właściciela
System SHALL wymagać poprawnych poświadczeń właściciela galerii (token lub hasło) przed przyjęciem jakiegokolwiek materiału oznaczonego jako pochodzący od fotografa, i SHALL odrzucić taki upload bez poprawnej autoryzacji.

#### Scenario: Import bez poświadczeń jest odrzucany
- **WHEN** ktoś spróbuje rozpocząć upload oznaczony jako materiał fotografa bez podania poprawnego tokenu/hasła właściciela danej galerii
- **THEN** system odrzuca upload i nie zapisuje żadnego pliku ani wpisu w bazie danych

#### Scenario: Import z poprawnymi poświadczeniami się powodzi
- **WHEN** właściciel galerii rozpocznie upload oznaczony jako materiał fotografa, podając poprawny token/hasło tej galerii
- **THEN** system przyjmuje plik i przetwarza go tym samym potokiem co zwykły upload gościa

### Requirement: Materiały fotografa dzielą tę samą galerię i chronologię co uploady gości
Zaimportowane materiały SHALL pojawiać się w tej samej galerii, w tej samej chronologicznej kolejności (wg czasu wgrania) co materiały wgrane przez gości, ale SHALL być oznaczone jako pochodzące od fotografa w sposób odróżnialny w interfejsie.

#### Scenario: Materiał fotografa widoczny w siatce galerii
- **WHEN** właściciel zaimportuje zdjęcie fotografa do galerii, w której są już zdjęcia gości
- **THEN** zaimportowane zdjęcie pojawia się w tej samej siatce galerii, we właściwym miejscu chronologicznym, z odróżniającą etykietą/odznaką źródła

#### Scenario: Materiał fotografa respektuje istniejącą moderację
- **WHEN** właściciel ukryje lub usunie zaimportowany materiał fotografa
- **THEN** zachowuje się dokładnie tak samo jak ukrycie/usunięcie materiału gościa (znika z widoku gości, propaguje się na żywo przez SSE)

### Requirement: Import respektuje limit pojemności galerii
Jeśli galeria ma ustawiony niezerowy limit pojemności dysku (`maxStorageBytes`), system SHALL odrzucić import materiału fotografa, który przekroczyłby ten limit, tak samo jak odrzuciłby przekraczający limit upload gościa.

#### Scenario: Import przekraczający limit jest odrzucony
- **WHEN** galeria ma ustawiony limit pojemności, a suma dotychczasowego zużycia i importowanego pliku przekroczyłaby ten limit
- **THEN** system odrzuca ten konkretny plik importu z czytelnym komunikatem o przekroczeniu limitu, nie przerywając pozostałych, mieszczących się w limicie plików tej samej sesji importu

### Requirement: Import podlega tym samym ograniczeniom przetwarzania co uploady gości
Materiały fotografa SHALL być przetwarzane (generowanie miniatur, ekstrakcja klatki wideo) przez tę samą, ograniczoną kolejkę przetwarzania co materiały gości, bez priorytetu ani osobnego limitu współbieżności.

#### Scenario: Import nie omija limitu współbieżności przetwarzania
- **WHEN** właściciel zaimportuje wiele plików fotografa jednocześnie z trwającymi uploadami gości
- **THEN** wszystkie pliki (fotografa i gości) są przetwarzane przez tę samą kolejkę o stałym limicie współbieżności, bez priorytetowego pomijania kolejki przez import
