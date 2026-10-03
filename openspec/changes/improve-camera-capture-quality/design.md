# Design

## Context

Obecna implementacja aparatu w przeglądarce (`CameraCapture.tsx`) wywołuje `getUserMedia` bez deklaracji rozdzielczości i bez optymalizacji sensora, co na smartfonach owocuje strumieniem VGA (640×480) lub 720p. Ponadto zrzut klatki z `<video>` omija natywne algorytmy przetwarzania zdjęć aparatu. Zdjęcia w galerii są nieostre, zwłaszcza w trudnych warunkach oświetleniowych na weselu.

## Goals / Non-Goals

**Goals:**
- Podniesienie rozdzielczości strumienia wideo podglądu do Full HD (`1920×1080` ideal) z elastycznym dopasowaniem do możliwości sprzętu.
- Automatyczna aktywacja trybu ciągłego autofokusu (`focusMode: "continuous"`), jeśli aparat urządzenia to umożliwia.
- Wykorzystanie API `ImageCapture` (`takePhoto()`) w przeglądarkach ze wsparciem (Chromium / Android), pobierającego pełną klatkę z matrycy z natywnym odszumianiem i ekspozycją.
- Niezawodny fallback dla Safari (iOS) i przeglądarek bez `ImageCapture` korzystający ze zoptymalizowanego strumienia `<video>`.
- Zachowanie kompozycji ozdobnej ramki wesela i eksport do JPEG o jakości 95% przy zachowaniu maksymalnego dłuższego boku do 2560px.
- Kompletne testy jednostkowe pokrywające obie ścieżki (z `ImageCapture` i fallback wideo).

**Non-Goals:**
- Modyfikacja potoku backendowego (TUS, Sharp, baza danych, N100 `p-queue(2)` pozostają bez zmian).
- Wprowadzanie manualnej kontroli parametrów ekspozycji w UI (ISO, czas naświetlania).

## Decisions

### 1. Optymalizacja ograniczeń `getUserMedia`
W zapytaniu o strumień wideo przekazujemy:
```ts
video: {
  facingMode: { ideal: facingMode },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
}
```
Użycie `ideal` zapobiega rzuceniu błędu `OverconstrainedError`, jeśli urządzenie ma słabszą kamerę (np. starszą kamerkę 720p). Przeglądarka wybierze najwyższy dostępny tryb bliski Full HD.

### 2. Zaawansowane ograniczenia ścieżki (Ciągły autofokus)
Po uzyskaniu strumienia sprawdzamy możliwości ścieżki wideo:
```ts
const [track] = stream.getVideoTracks();
const capabilities = track.getCapabilities?.() as { focusMode?: string[] } | undefined;
if (capabilities?.focusMode?.includes("continuous")) {
  track.applyConstraints?.({
    advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet],
  }).catch(() => {});
}
```
Zapewnia to dynamiczne wyostrzanie obrazu przy zmianie odległości od fotografowanego obiektu.

### 3. Hybrydowe robienie zdjęć: `ImageCapture` z fallbackiem do `<video>`
Podczas naciśnięcia spustu migawki:
1. Sprawdzamy czy w środowisku (`window`) dostępna jest klasa `ImageCapture` oraz czy `streamRef` posiada aktywną ścieżkę wideo.
2. Jeśli tak:
   - Wywołujemy `const blob = await imageCapture.takePhoto()`.
   - Wczytujemy blob jako `ImageBitmap` (lub `HTMLImageElement`) i przekazujemy do uogólnionej funkcji `captureImageSourceToCanvas(imageSource, canvas, colors, maxDimension)`.
3. Jeśli `ImageCapture` nie jest dostępne lub rzuci wyjątek:
   - Wykonujemy dotychczasowy zrzut klatki z `<video>` (`captureFrameToCanvas`).
4. Wynikowy canvas eksportujemy funkcją `canvasToJpegFile(canvas, filename, 0.95)`.

### 4. Uogólnienie w `photobooth.ts`
- Dodanie funkcji `captureImageSourceToCanvas(source: CanvasImageSource, width: number, height: number, canvas: HTMLCanvasElement, colors?: PhotoboothColors, maxDimension?: number)`.
- Reużycie tej funkcji w `captureFrameToCanvas` dla zachowania wstecznej kompatybilności.
- Podniesienie `MAX_CAPTURE_DIMENSION` do 2560px (odpowiednik Quad HD), aby zdjęcia na ekranach wysokiej gęstości pikseli zachowywały pełną wyrazistość.

## Risks / Trade-offs

- **[Risk] Większy rozmiar pliku wyjściowego** -> *Mitigation:* Zwiększenie rozdzielczości do Full HD/Quad HD wygeneruje pliki o wielkości 1.5–3 MB (zamiast 200–400 KB). Jest to idealny rozmiar dla protokołu TUS (chunk 5 MB) oraz potoku Sharp na N100, który przetwarza pliki do 100 MB bez problemu.
- **[Risk] Różnice w zachowaniu `takePhoto()` na Androidzie** -> *Mitigation:* W razie jakiegokolwiek błędu w `takePhoto()` funkcja natychmiast przechwytuje wyjątek i bezpiecznie przełącza się na sprawdzony zrzut z `<video>`.
- **[Risk] Wsparcie `ImageCapture` w jsdom** -> *Mitigation:* `ImageCapture` nie istnieje w jsdom domyślnie, więc istniejące testy automatycznie testują ścieżkę fallbacku; dla nowej ścieżki dodamy dedykowany mock w testach.

## Migration Plan

- Wdrożenie czysto frontendowe, bez konieczności migracji danych czy zmian w konfiguracji Docker/Caddy.
