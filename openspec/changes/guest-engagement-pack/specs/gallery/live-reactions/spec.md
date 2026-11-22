# Spec Delta

## Purpose

Umożliwia gościom weselnym anonimowe reagowanie serduszkami (❤️) na widoczne materiały w galerii z natychmiastową synchronizacją licznika w czasie rzeczywistym (SSE) oraz sortowaniem siatki galerii według popularności.

## ADDED Requirements

### Requirement: Anonimowe dodawanie i cofanie reakcji bez logowania
System SHALL umożliwiać każdemu gościowi posiadającemu dostęp do podglądu galerii zwiększenie (`action: "like"`) lub zmniejszenie (`action: "unlike"`) licznika polubień dowolnego materiału o statusie `ready` z poziomu kafelka w siatce galerii oraz z poziomu pełnoekranowego Lightboxa, bez wymogu zakładania konta ani logowania. Stan polubionych materiałów danego urządzenia SHALL być pamiętany lokalnie w przeglądarce gościa.

#### Scenario: Polubienie zdjęcia przez gościa
- **WHEN** gość kliknie przycisk serduszka przy zdjęciu o statusie `ready`, którego wcześniej nie polubił na swoim urządzeniu
- **THEN** licznik polubień tego zdjęcia zwiększa się o 1, ikona serduszka u tego gościa zmienia stan na aktywny (wypełniony), a stan polubienia zostaje zapisany w pamięci przeglądarki gościa

#### Scenario: Cofnięcie polubienia przez gościa
- **WHEN** gość ponownie kliknie aktywny przycisk serduszka przy zdjęciu, które wcześniej polubił na swoim urządzeniu
- **THEN** licznik polubień tego zdjęcia zmniejsza się o 1 (lecz SHALL NOT spaść poniżej `0`), a ikona serduszka wraca do stanu nieaktywnego

### Requirement: Synchronizacja licznika reakcji na żywo przez SSE
System SHALL rozsyłać zaktualizowaną liczbę polubień materiału (`likesCount`) przez kanał SSE do wszystkich klientów podłączonych do danej galerii (widok gościa, panel właściciela oraz Tryb TV) natychmiast po zmianie licznika.

#### Scenario: Inni goście widzą nowe serduszko w czasie rzeczywistym
- **WHEN** jeden z gości polubi zdjęcie w galerii
- **THEN** u pozostałych gości mających otwartą tę samą galerię oraz na ekranie Trybu TV licznik serduszek przy tym zdjęciu aktualizuje się w ciągu kilku sekund bez przeładowania strony i bez zresetowania otwartego Lightboxa

### Requirement: Ochrona prywatności materiałów ukrytych, oczekujących i usuniętych
System SHALL NOT pozwalać na dodawanie ani cofanie reakcji dla materiałów o statusie `hidden`, `pending` lub `deleted` oraz dla galerii nieaktywnych (`isActive: false`), z wyłączonym podglądem gości (`allowGuestViewing: false`) lub chronionych hasłem gościa bez ważnej sesji gościa.

#### Scenario: Próba polubienia ukrytego zdjęcia
- **WHEN** klient wyśle żądanie reakcji dla materiału o statusie `hidden`, `pending` lub `deleted`
- **THEN** serwer odrzuca żądanie kodem `404 Not Found` i nie zmienia licznika polubień ani nie emituje zdarzenia SSE

#### Scenario: Próba polubienia w galerii chronionej hasłem bez sesji
- **WHEN** klient bez ważnego ciasteczka sesji gościa wyśle żądanie reakcji do galerii z ustawionym `guestPassword`
- **THEN** serwer odrzuca żądanie kodem `401 Unauthorized`

### Requirement: Ochrona przed nadużyciami (Rate Limiting) w odizolowanym kubełku publicznym
Endpoint reakcji SHALL podlegać limitowi żądań w publicznym zasobniku rate-limitera (odseparowanym od zasobnika uwierzytelniania `authStore`), tak aby masowe klikanie serduszek nie mogło wyprzeć blokad brute-force logowania administratora ani właściciela.

#### Scenario: Przekroczenie limitu kliknięć reakcji
- **WHEN** ten sam adres IP przekroczy dozwolony limit żądań reakcji w oknie czasowym
- **THEN** serwer zwraca odpowiedź `429 Too Many Requests` z nagłówkiem `Retry-After`, a stan blokad logowania w `authStore` pozostaje nienaruszony

### Requirement: Sortowanie galerii według najpopularniejszych materiałów
Widok galerii gościa SHALL udostępniać przełącznik porządku sortowania pozwalający przełączać widok między kolejnością chronologiczną (*Najnowsze*) a kolejnością według liczby reakcji (*Najpopularniejsze ❤️*, malejąco po `likesCount`, a przy remisie od najnowszych).

#### Scenario: Przełączenie na widok „Najpopularniejsze”
- **WHEN** gość wybierze opcję sortowania „Najpopularniejsze” nad siatką galerii
- **THEN** materiały w siatce oraz kolejność nawigacji w Lightboxie układają się malejąco według liczby polubień `likesCount`
