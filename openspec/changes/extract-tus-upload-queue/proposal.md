# Proposal

## Why

`apps/web/src/components/UploaderDrawer.tsx` (gość) i `apps/web/src/components/owner/PhotographerImportPanel.tsx` (import fotografa) zawierają ok. 60% tej samej logiki: model elementu kolejki, wybór plików, `removeFile`, sekwencyjną pętlę `new tus.Upload` (endpoint, `retryDelays`, `chunkSize`), dropzone, wiersz pliku z paskiem postępu i przycisk „wyślij". Docstring panelu sam nazywa go „uproszczonym wariantem". Kopie zdążyły się rozjechać i dziś zachowują się różnie **przypadkowo**:

- drawer ogranicza częstość `onProgress` (próg 3% lub 100 ms), panel wykonuje `setFiles` przy każdym zdarzeniu — przy dużych filmach powoduje lawinę re-renderów;
- po całkowitej porażce panel i tak ustawia `justFinished` i pokazuje „zaimportowano N plików";
- oba komponenty wołają callback sukcesu (`onUploadSuccess` / `onImportSuccess`) także wtedy, gdy wszystkie pliki się nie powiodły;
- drawer zapisuje `error` w stanie, ale go nie renderuje; ma też martwe pole `uploadInstance`;
- reset stanu jest zapisany dwa razy (`resetQueue` i efekt `!isOpen`), a `isUploading`/`justFinished`/`files` to trzy flagi udające maszynę stanów.

## What Changes

- `apps/web/src/lib/tus-upload.ts`: funkcja `uploadFileViaTus(file, metadata, { onProgress }): Promise<"completed" | "error">` — jedyne miejsce ze stałymi `endpoint`, `chunkSize: 5 MB`, `retryDelays` i throttlingiem postępu.
- `apps/web/src/hooks/useUploadQueue.ts`: stan kolejki (`idle | uploading | done`), `addFiles`, `remove`, `clear`, `start(metadataFor)`; zwraca listę nieudanych; callback sukcesu wywoływany tylko gdy ≥ 1 plik się powiódł.
- Wspólne komponenty prezentacyjne `UploadFileRow` i `FilePickerDropzone` (teksty przez propsy/klucze i18n, bo namespace'y `GuestGallery` i `OwnerPanel` się różnią).
- `UploaderDrawer` (~250 linii docelowo) i `PhotographerImportPanel` (~130) używają powyższych; jedna, jawna semantyka po błędzie: nieudane pliki zostają w kolejce z widocznym komunikatem.
- Wspólny helper testowy `tests/helpers/tus-mock.ts` (sterowanie `failNames`, `defer`, przechwycone metadane) zamiast dwóch osobnych `vi.mock("tus-js-client")`.

## Capabilities

### New Capabilities

- `guest-upload-queue`: jednolite zachowanie kolejki uploadu (gość i import fotografa): postęp, błędy, sukces częściowy i ponowna próba.

### Modified Capabilities

(brak — istniejące wymagania gościa nie zmieniają się poza ujednoliconą obsługą błędów opisaną w specyfikacji)

## Impact

- Kod klienta: dwa komponenty, nowy `lib/`, nowy hook, testy. Bez zmian `packages/media` (protokół i metadane TUS bez zmian, w tym `source: "photographer"` i `ownerToken`).
- N100: uploady pozostają **sekwencyjne po stronie klienta**, `chunkSize` 5 MB i `retryDelays` bez zmian; przetwarzanie po stronie serwera dalej przez `p-queue` (concurrency 2).
- Bezpieczeństwo: `ownerToken` w metadanych TUS jest weryfikowany po stronie serwera (`verifyOwnerCredentialsForTus`); nie zmieniamy tej ścieżki.

## Non-goals / Poza zakresem

- Brak równoległego uploadu wielu plików ani zmian protokołu.
- Brak przerywania uploadów przy odmontowaniu w tej iteracji (odnotowane jako osobny follow-up, jeśli okaże się potrzebne).
- Brak zmian w `CameraCapture` (patrz `modal-a11y-hooks-and-camera-cleanup`).
