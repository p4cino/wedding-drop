# Proposal

## Why

W aplikacjach webowych typu PWA używanych na imprezach (jak WeddingDrop) stabilność i wysoka jakość obrazu to absolutne priorytety. Obecne podejście oparte o WebRTC/`getUserMedia` narzuca ograniczenia w aplikacjach przeglądarkowych na iOS i systemach Android, nie wykorzystując pełni możliwości matryc (takich jak Smart HDR, Deep Fusion, Tryb nocny). Zmiana na "Dual-Button UI" z wykorzystaniem natywnych elementów HTML `<input type="file" accept="image/*,video/*" capture="environment">` wywoła bezpośrednio systemowy aparat oraz aplikację galerii, gwarantując maksymalną stabilność, pełną rozdzielczość matrycy i płynność działania dla gości, bez konieczności utrzymywania złożonego stanu przeglądarkowej kamery (strumieni wideo).

## What Changes

- Usunięcie własnego komponentu kamery opartego o `getUserMedia` (`CameraCapture.tsx` i powiązanych hooków).
- Zastąpienie obecnego interfejsu głównym wzorcem "Dual-Button UI" – jednym przyciskiem otwierającym aparat na żywo (z atrybutem `capture`), drugim otwierającym galerię telefonu (bez atrybutu `capture`).
- **BREAKING**: Znaczne uproszczenie UI robienia zdjęć – gość nie widzi podglądu z kamery bezpośrenio na stronie WeddingDrop, lecz w pełnoekranowym natywnym interfejsie aparatu (na iOS / Android).
- Przekazywanie wykonanego/wybranego pliku bezpośrednio do działającego pod spodem mechanizmu TUS Uploader.

## Capabilities

### New Capabilities

- `gallery/native-upload-capture`: Obsługa natywnego wgrywania i robienia zdjęć za pomocą inputów systemowych.

### Modified Capabilities

- Brak modyfikowanych (nowa funkcja zastępuje stare rozwiązanie webowej kamery).

## Non-goals / Poza zakresem

- Nie wprowadzamy własnych filtrów ani nakładek AR – proces "robienia zdjęcia" spoczywa całkowicie na systemowym aparacie i aplikacji użytkownika.
- Modyfikacja potoku kompresji na serwerze (TUS, procesor) – pozostaje bez zmian.

## Impact

- Całkowite usunięcie logiki uprawnień kamery (zgody, odmowy) z poziomu przeglądarki (przejmują to natywne widoki).
- Brak wpływu na serwer i architekturę backendową – plik z systemowego aparatu wpada do aplikacji webowej jako standardowy obiekt `File` i wędruje wprost do serwera TUS.
- **N100 constraints:** Zmiana nie narusza ograniczeń wydajnościowych (serwer i transkodowanie wideo (FFmpeg) nadal chronione są limitem p-queue z `concurrency: 2`). Pliki z matryc systemowych są zazwyczaj większe i lepszej jakości, jednak system przetwarzania w tle radzi sobie z nimi tak samo jak z poprzednimi.
