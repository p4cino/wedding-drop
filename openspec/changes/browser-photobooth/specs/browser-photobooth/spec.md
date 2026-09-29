# Spec Delta

## Purpose

Pozwala gościowi zrobić zdjęcie bezpośrednio z poziomu przeglądarki (aparat urządzenia), opcjonalnie z ramką w kolorach motywu wesela, i wysłać je do galerii tym samym potokiem co zwykły upload pliku.

## ADDED Requirements

### Requirement: Uruchomienie aparatu w przeglądarce z poziomu drawera uploadu
System SHALL udostępniać w drawerze uploadu opcję uruchomienia podglądu na żywo z kamery urządzenia gościa, jako alternatywę dla wyboru istniejącego pliku.

#### Scenario: Gość otwiera podgląd kamery
- **WHEN** gość wybierze opcję "Zrób zdjęcie" w drawerze uploadu i przeglądarka posiada dostęp do kamery
- **THEN** system wyświetla podgląd obrazu na żywo z kamery urządzenia wraz z przyciskiem zrobienia zdjęcia

#### Scenario: Brak zgody lub brak kamery
- **WHEN** przeglądarka odmówi dostępu do kamery lub urządzenie jej nie posiada
- **THEN** system pokazuje czytelny komunikat i pozostawia dostępny standardowy wybór pliku z galerii jako jedyną opcję, bez blokowania reszty formularza uploadu

### Requirement: Zrobione zdjęcie trafia do tego samego potoku co zwykły upload
Zdjęcie zrobione w przeglądarce SHALL zostać przekazane do dokładnie tego samego mechanizmu wysyłki (wznawialny upload, kolejka przetwarzania, zapis w galerii) co plik wybrany ręcznie przez gościa.

#### Scenario: Zrobione zdjęcie pojawia się w galerii
- **WHEN** gość zrobi zdjęcie w przeglądarce i potwierdzi wysyłkę
- **THEN** zdjęcie pojawia się w galerii wesela na tych samych zasadach (miniatura, podpis, widoczność na żywo u innych gości) co zdjęcie wgrane z rolki aparatu

#### Scenario: Zrobione zdjęcie respektuje ustawienia galerii
- **WHEN** galeria ma wyłączoną możliwość dodawania filmów (`allowVideos: false`) lub jest nieaktywna
- **THEN** funkcja zrobienia zdjęcia w przeglądarce podlega tym samym ograniczeniom co zwykły upload (zdjęcia nie są filmami więc ograniczenie `allowVideos` jej nie dotyczy; nieaktywna galeria odrzuca wysyłkę tak samo jak dziś)

### Requirement: Opcjonalna ramka w kolorach motywu wesela
System SHALL umożliwiać złożenie zrobionego zdjęcia z dekoracyjną ramką wykorzystującą kolory motywu skonfigurowane dla danej galerii (te same, co w generatorze winietek na stół).

#### Scenario: Ramka używa kolorów motywu danej pary
- **WHEN** gość zrobi zdjęcie w przeglądarce dla galerii, która ma ustawiony niestandardowy kolor motywu
- **THEN** finalny obraz wysłany do galerii zawiera ramkę w tych kolorach motywu

#### Scenario: Domyślny motyw gdy brak ustawień
- **WHEN** galeria nie ma jeszcze zapisanych niestandardowych ustawień koloru
- **THEN** system stosuje domyślną ramkę bez błędu

### Requirement: Zdjęcie z aparatu przeglądarki respektuje wymóg podpisu gościa
Formularz robienia zdjęcia w przeglądarce SHALL oferować to samo, opcjonalne pole podpisu ("np. Wujek Janusz"), co standardowy formularz uploadu pliku.

#### Scenario: Podpis towarzyszy zrobionemu zdjęciu
- **WHEN** gość wpisze swój podpis przed zrobieniem zdjęcia i je wyśle
- **THEN** wysłane zdjęcie ma przypisany ten sam podpis, widoczny tak samo jak przy zwykłym uploadzie
