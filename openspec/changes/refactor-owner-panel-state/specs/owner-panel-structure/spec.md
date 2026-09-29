# Spec Delta

## Purpose

Panel właściciela komunikuje się z API przez jedną, typowaną warstwę i pokazuje użytkownikowi wynik każdej operacji, w tym błędy.

## ADDED Requirements

### Requirement: Pojedynczy punkt dołączania poświadczeń właściciela
Wszystkie żądania panelu właściciela do chronionych tras SHALL dołączać token właściciela w nagłówku `x-owner-token` przez jedną wspólną warstwę, a token SHALL NOT być dodatkowo wysyłany w ciele żądania.

#### Scenario: Żądanie moderacji
- **WHEN** właściciel zmienia status zdjęcia lub życzenia
- **THEN** żądanie zawiera nagłówek `x-owner-token`, a ciało nie zawiera pola `token`

### Requirement: Atomowy stan eksportu Google Drive
Stan eksportu Google Drive (połączenie, e-mail, status, postęp, folder, data) SHALL być aktualizowany jako jedna całość z każdego źródła (logowanie, SSE, polling), a status SHALL należeć do skończonego zbioru `idle`, `running`, `completed`, `failed`, `interrupted`.

#### Scenario: Zdarzenie postępu z SSE
- **WHEN** panel odbierze zdarzenie `gdrive-progress`
- **THEN** status, postęp i identyfikator folderu zmieniają się w jednej aktualizacji, bez stanu pośredniego

### Requirement: Błędy operacji są widoczne
Nieudane operacje panelu (moderacja, usuwanie, połączenie/rozłączenie Dysku, start eksportu) SHALL wyświetlać komunikat użytkownikowi i SHALL NOT być połykane cicho.

#### Scenario: Błąd zmiany statusu zdjęcia
- **WHEN** odpowiedź API na zmianę statusu jest błędem
- **THEN** panel pokazuje komunikat błędu, a stan zdjęcia w interfejsie pozostaje zgodny z serwerem

### Requirement: Ograniczony rozmiar strony panelu
Plik strony panelu właściciela SHALL nie zawierać logiki komunikacji z API ani zarządzania stanem Google Drive, które SHALL być wydzielone do hooków, tak aby plik nie przekraczał ok. 300 linii.

#### Scenario: Przegląd struktury
- **WHEN** zmiana zostanie zaakceptowana
- **THEN** `page.tsx` deleguje komunikację do `useOwnerApi` i stan Google Drive do `useGDriveExport`
