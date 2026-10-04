# Proposal

## Why

Wraz ze wzrostem popularności systemu, pary młode potrzebują większej kontroli nad tym, co pojawia się w ich galerii i kto ma do niej dostęp. Obecny model "pełen dostęp dla każdego znającego link" jest świetny i wygodny, jednak część użytkowników oczekuje możliwości ręcznego zatwierdzania zdjęć przed ich publikacją oraz zabezpieczenia dostępu do galerii hasłem. Funkcje te rozwiązują problem prywatności i zapobiegają przypadkowej publikacji niechcianych treści (tzw. "Advanced Moderation"). Wszystkie te opcje muszą być jednak włączane opcjonalnie (opt-in), tak aby domyślne, bezstykowe doświadczenie gości pozostało nienaruszone.

## What Changes

- **Ochrona hasłem na poziomie galerii**: Możliwość ustawienia ogólnego hasła (PIN/hasło) dla gości, bez którego galeria nie wyświetli treści.
- **Kolejka akceptacji (Approval Queue)**: Możliwość włączenia trybu, w którym nowe zdjęcia/filmy od gości wpadają w status "pending" (oczekujące) i są widoczne publicznie dopiero po kliknięciu "Zatwierdź" w panelu właściciela.
- **Szczegółowe uprawnienia**: Właściciel galerii będzie mógł decydować, czy goście mogą przeglądać galerię, wgrywać nowe pliki, czy pobierać materiały (aktualnie istnieje już opcja blokady pobierania, zostanie ona ustrukturyzowana obok innych uprawnień).
- Panel właściciela zostanie wzbogacony o zakładkę "Ustawienia prywatności i moderacji".
- Interfejs gościa będzie obsługiwał ekran logowania hasłem (jeśli włączone).

## Capabilities

### New Capabilities
- `gallery/access-control`: Kontrola dostępu gości do galerii, ochrona hasłem oraz granularne uprawnienia (np. tylko upload, tylko podgląd).
- `gallery/media-moderation`: Kolejka zatwierdzania plików w panelu właściciela oraz cykl życia pliku (statusy oczekujący, widoczny, ukryty).

### Modified Capabilities
- Brak modyfikacji w istniejących specyfikacjach (to nowa, wyizolowana funkcjonalność).

## Impact

- **Baza danych (`packages/db`)**: Dodanie kolumn w tabeli `galleries` (np. `guestPassword`, `isApprovalQueueEnabled`, `allowGuestUploads`). Dodanie/uwzględnienie statusu `pending` w tabeli `mediaItems` (enum `status` obecnie zawiera `visible`, `hidden`, `deleted`).
- **Endpointy API (`apps/web`)**: Dodanie mechanizmu weryfikacji hasła gościa (np. cookie z sesją gościa lub nagłówek) dla tras pobierania struktury i pobierania plików multimedialnych z użyciem `media-file-handler.ts`. Ograniczenie przesyłania plików zależy od nowej flagi `allowGuestUploads`.
- **Panel właściciela (`apps/web`)**: Nowa sekcja do włączania tych opcji, a także panel akceptacji zdjęć.
- **N100 Constraints**: Path safety i streamowanie ZIP'ów muszą zostać zweryfikowane pod kątem autoryzacji sesji gościa. Ochrona przed atakami brute-force na PIN (wymagane rate-limitowanie / time-safe porównania).

## Non-goals (Poza zakresem)
- Moderacja wykorzystująca algorytmy AI do analizy obrazów - cała moderacja opiera się na ręcznej weryfikacji właściciela.
- Rejestracja kont u gości - mechanizm ochrony hasłem ma być globalny (jedno hasło dla całej galerii) lub oparty na linkach, bez imiennych kont gości.
