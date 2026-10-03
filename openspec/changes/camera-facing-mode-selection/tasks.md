# Tasks

## 1. i18n & Wsparcie pomocnicze
- [x] 1.1 Dodać klucze tłumaczeń dla przełącznika aparatu (np. `cameraSwitchCamera`: "Przełącz aparat (przód/tył)") w `apps/web/messages/pl.json`, `en.json`, `de.json`.
- [x] 1.2 Rozszerzyć helper `tests/helpers/media-devices.ts` o mockowanie `enumerateDevices` zwracającego listę urządzeń wejściowych wideo (`videoinput`).

## 2. Implementacja w `CameraCapture.tsx`
- [x] 2.1 Wprowadzić stan `facingMode: "user" | "environment"` inicjalizowany z `localStorage` (fallback: `environment`).
- [x] 2.2 Zaktualizować zapytanie `getUserMedia` w `CameraCapture.tsx` do `{ video: { facingMode: { ideal: facingMode } }, audio: false }`.
- [x] 2.3 Dodać sprawdzanie `navigator.mediaDevices.enumerateDevices()` po uruchomieniu strumienia w celu wykrycia czy urządzenie ma więcej niż jedną kamerę wideo (`canSwitchCamera`).
- [x] 2.4 Dodać przycisk przełączania kamery w interfejsie podglądu (np. obok przycisku zamknięcia 'X' w prawym górnym rogu z ikoną `SwitchCamera` z `lucide-react`), widoczny gdy `canSwitchCamera` jest prawdą i stan kamery to `ready`.
- [x] 2.5 Dodać przełączanie odbicia lustrzanego w podglądzie wideo (`scale-x-[-1]` aktywne tylko gdy `facingMode === "user"`).
- [x] 2.6 Obsłużyć płynne zwalnianie starego strumienia (`stopStream()`) i uruchamianie nowego przy zmianie `facingMode`.

## 3. Testy i Walidacja
- [x] 3.1 Dodać testy jednostkowe w `apps/web/tests/unit/components/CameraCapture.test.tsx` weryfikujące:
  - Użycie `{ facingMode: { ideal: ... } }` w wywołaniu `getUserMedia`.
  - Wyświetlanie przycisku przełączenia, gdy dostępne są co najmniej 2 kamery.
  - Ukrycie przycisku przełączenia, gdy dostępna jest tylko 1 kamera.
  - Zmianę `facingMode` i ponowne wywołanie `getUserMedia` po kliknięciu przycisku przełączenia.
  - Zastosowanie klasy lustrzanego odbicia tylko dla przedniego aparatu.
- [x] 3.2 Uruchomić testy jednostkowe: `pnpm --filter @wedding-drop/web test`.
- [x] 3.3 Uruchomić Biome i type-check: `pnpm check-types` i `pnpm biome check`.

## 4. Dokumentacja
- [x] 4.1 Zaktualizować `DOCUMENTATION.md` oraz `README.md` w sekcji robienia zdjęć w przeglądarce o informację o możliwości wyboru i przełączania przedniego i tylnego aparatu.
