# Proposal

## Why

Obecna implementacja robienia zdjęć w przeglądarce (`CameraCapture.tsx`) wymusza przednią kamerę urządzenia poprzez sztywne ograniczenie `facingMode: "user"`. Na weselu goście często chcą sfotografować nie tylko siebie (selfie), ale przede wszystkim Parę Młodą, dekoracje sali, parkiet tanieczny czy znajomych przy stoliku za pomocą głównego (tylnego) aparatu telefonu. Brak możliwości przełączenia aparatu powoduje frustrację i zmusza gości do opuszczania podglądu aparatu w aplikacji i wgrywania zdjęć z systemowej rolki. Ponadto sztywne ograniczenia bez słowa kluczowego `ideal` mogą powodować błędy `OverconstrainedError` na części urządzeń.

## What Changes

- Zastąpienie sztywnego `facingMode: "user"` dynamicznym wyborem orientacji kamery (`user` vs `environment`) z bezpiecznym ograniczeniem `{ facingMode: { ideal: facingMode } }`.
- Dodanie przycisku szybkiego przełączania kamery (ikona flip/switch) w interfejsie podglądu `CameraCapture`, dostępnego obok przycisku zamknięcia lub w obrębie kontrolek aparatu.
- Wykrywanie dostępności wielu kamer przez `navigator.mediaDevices.enumerateDevices()` — jeśli urządzenie ma tylko jedną kamerę wideo (np. pojedynczą kamerkę internetową w laptopie), przycisk przełączenia jest elegancko ukrywany.
- Zapewnienie prawidłowego lustrzanego odbicia podglądu (mirroring): odbicie lustrzane (`scale-x-[-1]`) aktywne wyłącznie dla przedniej kamery (`user`), brak odbicia dla tylnego aparatu (`environment`).
- Zapisywanie wybranego trybu kamery w `localStorage` (opcjonalnie z domyślnym trybem tylnym lub przednim), aby kolejne otwarcie aparatu pamiętało preferencję gościa.
- Uzupełnienie tłumaczeń (`cameraSwitchCamera`) w językach `pl`, `en`, `de`.

## Capabilities

### New Capabilities

(brak)

### Modified Capabilities

- `browser-photobooth`: rozszerzenie o możliwość wyboru i przełączania między przednim a tylnym aparatem urządzenia oraz bezpieczną negocjację strumienia wideo.

## Impact

- Zmiany wyłącznie w warstwie klienta: `apps/web/src/components/CameraCapture.tsx`, pliki tłumaczeń `apps/web/messages/*.json` oraz powiązane testy jednostkowe.
- Zero wpływu na backend, bazę danych, TUS ani ograniczenia sprzętowe Intel N100 (kolejka `p-queue: 2`, FFmpeg watchdog, transfer-encoding ZIP pozostają w 100% nienaruszone).
- Pełna zgodność z polityką bezpieczeństwa HTTPS / WebRTC.

## Non-goals / Poza zakresem

- Brak zaawansowanego zoomu optycznego, zmiany balansu bieli czy wyboru konkretnych obiektywów makro/szerokokątnych z listy rozwijanej (wystarcza prosty przełącznik przód/tył).
- Brak nagrywania filmów z poziomu tego komponentu (komponent służy wyłącznie do zdjęć ekspresowych).
- Brak modyfikacji potoku przetwarzania grafik po stronie serwera.
