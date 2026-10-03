# Design

## Context

Komponent `apps/web/src/components/CameraCapture.tsx` pozwala gościom weselnym wykonać zdjęcie bezpośrednio w przeglądarce za pośrednictwem API `navigator.mediaDevices.getUserMedia`. Aktualny kod w wywołaniu `getUserMedia` przekazuje na sztywno `{ video: { facingMode: "user" } }`. W efekcie użytkownik nie ma możliwości skorzystania z głównego (tylnego) aparatu smartfona, co ogranicza użyteczność funkcji podczas przyjęcia weselnego.

## Goals / Non-Goals

**Goals:**
- Umożliwienie gościom łatwego przełączania między przednim a tylnym aparatem za pomocą intuicyjnego przycisku w podglądzie wideo.
- Bezpieczne ograniczenie `facingMode: { ideal: facingMode }` zapobiegające błędom `OverconstrainedError` na urządzeniach z jednym przetwornikiem obrazu.
- Automatyczne ukrywanie przycisku przełączania na urządzeniach z tylko jedną kamerą (sprawdzane przez `enumerateDevices()`).
- Prawidłowe odbicie lustrzane obrazu podglądu (mirroring) – włączone dla aparatu przedniego (`user`), wyłączone dla aparatu tylnego (`environment`).
- Zapis ostatnio wybranego trybu w pamięci lokalnej (`localStorage`), aby kolejne otwarcie aparatu korzystało z preferencji użytkownika.
- Pełna dostępność (a11y) dla przycisku zmiany kamery (`aria-label`, focus states) oraz wielojęzyczność (`pl`, `en`, `de`).

**Non-Goals:**
- Ręczny wybór konkretnego identyfikatora urządzenia (`deviceId`) w menu select – w mobilnych przeglądarkach wystarcza przełącznik trybów przód/tył (`facingMode`).
- Zmiany po stronie serwera, bazy danych lub potoku TUS / Sharp.
- Dodawanie filtrów barwnych lub efektów AR.

## Decisions

### 1. Domyślny tryb i preferencja w `localStorage`
- Domyślnym trybem początkowym będzie `environment` (tylny aparat), który jest najczęstszym wyborem przy robieniu zdjęć na imprezach, lub odczytany z `localStorage` (klucz: `wedding_drop_camera_facing`), jeśli użytkownik wcześniej wybrał inny tryb.
- Jako fallback, jeśli `localStorage` jest niedostępny lub pusty, stosujemy `environment`.

### 2. Bezpieczna negocjacja strumienia (`ideal` zamiast sztywnej wartości)
- Zamiast `{ facingMode: "user" }`, przekazujemy `{ facingMode: { ideal: currentFacingMode } }`.
- Dzięki `ideal`, jeśli np. użytkownik na laptopie z jedną kamerą przednią ma ustawiony tryb `environment`, przeglądarka nie rzuci błędu `OverconstrainedError`, lecz dostarczy jedyną dostępną kamerę.

### 3. Płynne przełączanie i czyszczenie strumienia
- Kliknięcie przycisku przełączenia:
  1. Zatrzymuje bieżący strumień (`stopStream()`).
  2. Zmienia stan `facingMode` (`user` <-> `environment`).
  3. Zapisuje nową wartość w `localStorage`.
  4. Inicjalizuje nowy strumień z nowymi ograniczeniami.
- Zapobiega to konfliktom o zasób kamery w przeglądarkach mobilnych (zwłaszcza Safari iOS, które blokuje otwarcie drugiego strumienia, dopóki pierwszy nie zostanie zwolniony).

### 4. Wykrywanie dostępności wielu kamer (`hasMultipleCameras`)
- Po pomyślnym uzyskaniu strumienia (gdy przeglądarka ma już uprawnienia i ujawnia listę urządzeń), wywołujemy `navigator.mediaDevices.enumerateDevices()`.
- Filtrujemy urządzenia o `kind === "videoinput"`.
- Jeśli liczba kamer wideo jest większa niż 1 (lub lista zawiera urządzenia o różnych etykietach/kierunkach), flaga `canSwitchCamera` ustawiana jest na `true`.
- Na urządzeniach z tylko 1 kamerą (lub gdy `enumerateDevices` nie jest wspierane) przycisk przełączenia jest ukrywany, aby nie wprowadzać użytkownika w błąd.

### 5. Wizualne odbicie lustrzane (Mirroring)
- Dodanie warunkowej klasy wideo:
  - `facingMode === "user"` -> klasa `scale-x-[-1]` (naturalny widok selfie).
  - `facingMode === "environment"` -> brak transformacji (normalny podgląd otoczenia).
- Klatka przechwytywana na `<canvas>` przez `captureFrameToCanvas`:
  - Warto również rozważyć, czy zrobione selfie ma być odbite jak w lustrze, czy zachować standardowy układ. Domyślnie `captureFrameToCanvas` rysuje klatkę 1:1 z wideo.

## Risks / Trade-offs

- **[Risk] Blokada kamery przy szybkim klikaniu przełącznika** -> *Mitigation:* Podczas zmiany kamery i stanu `starting` przycisk przełączania jest wyłączony (`disabled`), a ewentualne trwające żądanie jest anulowane przez flagę `cancelled`.
- **[Risk] Brak uprawnień do `enumerateDevices`** -> *Mitigation:* `enumerateDevices()` wywołujemy po `getUserMedia`, a w razie błędu/pustej listy zachowawczo ukrywamy przycisk lub pozwalamy na przełączenie z fallbackiem `ideal`.
- **[Risk] Testy jsdom nie implementują `enumerateDevices` ani `facingMode`** -> *Mitigation:* Uzupełnienie helpera `apps/web/tests/helpers/media-devices.ts` o mockowanie `enumerateDevices`.

## Migration Plan

- Zmiana w 100% kompatybilna wstecznie, nie wymaga migracji bazy danych ani zmian w konfiguracji kontenerów.
- Wdrożenie w standardowym cyklu release aplikacji frontendowej.
