# Design

## Context

Aplikacja obecnie opiera się na złożonym strumieniowaniu WebRTC w `CameraCapture.tsx`, by przechwytywać obraz bezpośrednio w przeglądarce. Prowadzi to do obniżonej jakości zdjęć na smartfonach, które w aplikacjach systemowych wykorzystują zaawansowane mechanizmy poprawy obrazu (np. Deep Fusion). Przejście na standardowe natywne kontrolki wejścia (`<input type="file">`) eliminuje potrzebę utrzymywania skomplikowanej logiki kamery w przeglądarce.

## Goals / Non-Goals

**Goals:**
- Całkowite pozbycie się zależności od `getUserMedia` i powiązanych hooków.
- Implementacja natywnych rozwiązań w UI za pomocą atrybutu `capture="environment"`.
- Płynne podpięcie nowo wybranych lub zrobionych plików (tzw. obiektu `File`) do mechanizmu `useUploadQueue` (protokół TUS), zachowując obecne działanie kolejki w tle.

**Non-Goals:**
- Nie zmieniamy obsługi uploadu na backendzie.
- Nie dodajemy żadnych własnych edytorów zdjęć (kadrowanie/filtry).

## Decisions

1. **Zastąpienie WebRTC natywnymi inputami**:
   * Zamiast `CameraCapture.tsx`, użyjemy ukrytych elementów `<input type="file">` połączonych (przez useRef i wywołanie `.click()`) z atrakcyjnymi wizualnie przyciskami "Dual-Button".
   * Pierwszy input: `accept="image/*,video/*" capture="environment"` – otwiera bezpośrednio aparat.
   * Drugi input: `accept="image/*,video/*"` (ewentualnie z dopiskiem `multiple`) – otwiera galerię i pozwala wybrać starsze pliki.

2. **Przepływ zdarzeń (Event Flow)**:
   * Gdy gość naciśnie przycisk aparatu, otwiera się natywny aparat.
   * Gość wykonuje zdjęcie i je zatwierdza w natywnym oknie.
   * Zdarzenie `onChange` w niewidocznym `<input>` łapie wybrany obiekt `File`.
   * Komponent przekazuje wybrany plik bezpośrednio do `useUploadQueue().addFiles([file])`.
   * Otwiera się istniejąca "szuflada" uploader'a (`UploaderDrawer.tsx`), która wizualizuje postęp (dokładnie tak, jak dotychczas).

## Risks / Trade-offs

- **[Risk] Pamięć na słabszych urządzeniach:** Zrobienie 50-megapikselowego zdjęcia zrzuca duży plik w pamięci przeglądarki przed uploadem. 
  → **Mitigation:** Mechanizm TUS potrafi chunckować wysyłkę plików, a nasz uploader zachowuje pliki pojedynczo. Przetwarzanie i zmniejszanie zdjęć odbywa się asynchronicznie po stronie serwera (z ujemnym priorytetem i throttlingiem).
- **[Risk] Brak poglądu u nas w aplikacji:** Gość traci poczucie, że znajduje się "w aplikacji" podczas robienia zdjęcia. 
  → **Mitigation:** To standardowy wzorzec w web-aplikacjach (np. WhatsApp Web). Jakość obrazu i łatwość wykonania przeważają nad tą drobną niespójnością UX.
