# Spec Delta

## Purpose

Pozwala gościom zostawić tekstowe życzenia dla Pary Młodej niezależnie od przesyłania zdjęć/filmów, widoczne na żywo w galerii i podlegające tej samej moderacji właściciela co media.

## ADDED Requirements

### Requirement: Dodanie życzenia bez logowania i bez pliku
System SHALL umożliwiać dowolnemu gościowi dodanie tekstowego życzenia do aktywnej galerii bez logowania, rejestracji i bez konieczności dołączenia zdjęcia lub filmu.

#### Scenario: Gość dodaje życzenie
- **WHEN** gość wypełni pole treści życzenia (opcjonalnie z imieniem/nazwiskiem) i wyśle formularz dla istniejącej, aktywnej galerii
- **THEN** system zapisuje życzenie i natychmiast staje się ono widoczne w księdze życzeń tej galerii

#### Scenario: Pusta treść życzenia jest odrzucana
- **WHEN** gość spróbuje wysłać życzenie z pustą treścią
- **THEN** system odrzuca żądanie i nie zapisuje pustego wpisu

#### Scenario: Nieaktywna lub nieistniejąca galeria odrzuca życzenie
- **WHEN** ktoś spróbuje dodać życzenie do galerii nieistniejącej lub oznaczonej jako nieaktywna
- **THEN** system odrzuca żądanie z odpowiednim komunikatem błędu

### Requirement: Widoczność życzeń wyłącznie o statusie „ready” dla gości
Publiczna lista życzeń SHALL zwracać wyłącznie wpisy o statusie `ready` i SHALL NOT ujawniać życzeń o statusie `hidden` lub `deleted` bez poświadczeń właściciela lub administratora.

#### Scenario: Ukryte życzenie niewidoczne dla gości
- **WHEN** właściciel galerii ukryje życzenie
- **THEN** to życzenie natychmiast znika z listy widocznej dla gości i nie jest zwracane przez publiczny odczyt listy życzeń

#### Scenario: Właściciel widzi wszystkie życzenia
- **WHEN** właściciel galerii poda prawidłowe poświadczenia (token lub hasło właściciela)
- **THEN** może pobrać pełną listę życzeń łącznie z ukrytymi, ale bez usuniętych trwale (`deleted`)

### Requirement: Aktualizacja listy życzeń na żywo
Widok galerii gościa SHALL aktualizować listę życzeń w czasie rzeczywistym w miarę dodawania nowych wpisów przez innych gości, bez konieczności ręcznego odświeżania strony.

#### Scenario: Nowe życzenie pojawia się u innych gości na żywo
- **WHEN** jeden gość doda nowe życzenie
- **THEN** inni goście przeglądający w tym momencie tę samą galerię widzą nowe życzenie na liście w ciągu kilku sekund, bez odświeżania strony

### Requirement: Moderacja życzeń przez właściciela galerii
System SHALL umożliwiać właścicielowi galerii ukrycie i trwałe usunięcie dowolnego życzenia, analogicznie do moderacji zdjęć i filmów.

#### Scenario: Właściciel ukrywa niestosowne życzenie
- **WHEN** właściciel galerii oznaczy życzenie jako ukryte
- **THEN** status życzenia zmienia się na `hidden` i znika z widoku gości, a zmiana propaguje się na żywo do wszystkich otwartych widoków galerii

#### Scenario: Właściciel trwale usuwa życzenie
- **WHEN** właściciel galerii usunie życzenie
- **THEN** status życzenia zmienia się na `deleted` i wpis nie jest już zwracany żadnemu odbiorcy (ani gościom, ani w widoku moderacji właściciela)

### Requirement: Życzenia dołączone do eksportu galerii
System SHALL umożliwiać właścicielowi pobranie wszystkich widocznych życzeń danej galerii w formie pliku tekstowego, jako część procesu eksportu galerii.

#### Scenario: Eksport zawiera życzenia
- **WHEN** właściciel pobierze eksport galerii zawierający życzenia
- **THEN** pobrany plik zawiera treść oraz autora (jeśli podany) każdego życzenia o statusie innym niż `deleted`, zgodnie z tymi samymi zasadami widoczności `hidden`, co przy przeglądaniu przez właściciela
