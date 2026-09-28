# Design

## Context

Zobacz `proposal.md` — sekcja „Why”. Dzisiejszy potok uploadu: `UploaderDrawer.tsx` (gość) → `tus-js-client` → `POST /api/upload/tus` → `packages/media/src/tus-server.ts` (`onUploadCreate` waliduje metadane przez `tusUploadMetadataDto`, `POST_FINISH` woła `scheduleMediaProcessing`) → `media-processor.ts` (kolejka `p-queue(2)`, Sharp/FFmpeg) → wpis w `media_items` → `sseBus.notifyNewMedia`. Trasa TUS jest montowana w `apps/web/server.ts` (`tusServer.handle(req, res)`), które ma dostęp do surowego `req`/`res` Node, a nie do `NextRequest` używanego przez zwykłe trasy API. Weryfikacja tokenu właściciela (`verifyOwnerToken`) to dziś czysta funkcja w `apps/web/src/lib/auth.ts` (tylko `crypto` + zmienna środowiskowa, bez zależności od Next.js), używana już przez `authenticateOwner` w trasach właściciela.

## Goals / Non-Goals

**Goals:**
- Import fotografa korzysta z dokładnie tego samego potoku TUS → kolejka → `media_items` → SSE co dziś, różniąc się tylko wymogiem autoryzacji i dodatkowym polem `source`.
- Weryfikacja autoryzacji właściciela nie wymaga przenoszenia `verifyOwnerToken` do `packages/media` ani odwrócenia kierunku zależności między pakietami (`apps/web` → `packages/media`, nigdy odwrotnie).

**Non-Goals:**
- Brak nowego mechanizmu kolejkowania priorytetowego (patrz Non-Goals w proposal.md).
- Brak wprowadzania ogólnego mechanizmu limitów dysku dla gości — tylko dla ścieżki importu fotografa (patrz uwaga w proposal.md).

## Decisions

- **`initTusServer` w `packages/media/src/tus-server.ts` przyjmuje nowy parametr — funkcję weryfikującą właściciela, wstrzykiwaną z `apps/web/server.ts`** (np. `initTusServer(dataDir, { verifyOwnerCredentials })`), zamiast przenosić `verifyOwnerToken`/`getAdminSecret` do `packages/media` lub duplikować logikę HMAC. `server.ts` (wewnątrz `apps/web`) importuje `verifyOwnerToken`/`verifyOwnerPassword`-podobną logikę z `@/lib/auth` i przekazuje ją jako zwykłą funkcję JS do inicjalizacji serwera TUS. Zachowuje to istniejący kierunek zależności (`apps/web` zależy od `packages/media`, nigdy odwrotnie) bez powielania kodu HMAC.
- **Rozszerzenie `tusUploadMetadataDto` (`packages/db/src/validators.ts`) o opcjonalne pola `source` (`"guest" | "photographer"`, domyślnie `"guest"`) i `ownerToken`.** Gdy `source === "photographer"`, `onUploadCreate` w `tus-server.ts` woła wstrzykniętą funkcję weryfikującą z `gallerySlug` i `ownerToken` z metadanych; brak sukcesu → ten sam wzorzec odrzucenia co dziś dla brakującego `gallerySlug` (`status_code: 401`).
- **Nowa kolumna `source` w `media_items`** (text, domyślnie `"guest"`, wartości `"guest" | "photographer"`) ustawiana w `scheduleMediaProcessing`/`processMediaTask` na podstawie metadanych TUS — analogicznie do już istniejącego przekazywania `uploaderName`.
- **Sprawdzenie limitu `maxStorageBytes` dzieje się w `onUploadCreate`, tylko gdy `source === "photographer"`**, przez zapytanie sumujące `fileSize` istniejących `media_items` danej galerii (ten sam kształt zapytania co dzisiejsze liczniki statystyk właściciela) i porównanie z `upload.size` zadeklarowanym w żądaniu TUS + już zajętą sumą. Odrzucenie pojedynczego pliku nie przerywa TUS-owej sesji pozostałych plików w tej samej paczce importu (`tus-js-client` traktuje każdy plik jako osobny upload).
- **UI importu jako nowy, uproszczony wariant `UploaderDrawer`** (bez pola podpisu gościa, z komunikatem postępu paczki plików) w panelu właściciela — reużywa identyczną konfigurację `tus.Upload` (endpoint, `chunkSize`, `retryDelays`), różniącą się tylko dodatkowymi polami metadanych (`source`, `ownerToken`) i brakiem pola tekstowego podpisu.

## Risks / Trade-offs

- [Ryzyko: masowy import wielu dużych plików w trakcie trwającej recepcji (równolegle z uploadami gości) może zauważalnie spowolnić przetwarzanie bieżących zdjęć gości, bo dzieli tę samą kolejkę `p-queue(2)`] → Mitigacja: świadomy wybór (patrz Non-Goals) — dokumentacja (`README.md`/`DOCUMENTATION.md`) jasno zaleci wykonywanie masowego importu fotografa poza szczytem aktywności gości (np. dzień po weselu), zamiast wprowadzać komplikującą priorytetyzację kolejki.
- [Ryzyko: pierwsze wdrożenie egzekwowania `maxStorageBytes` może zaskoczyć administratorów, którzy ustawili ten limit dawno temu bez oczekiwania, że cokolwiek go faktycznie wymusi] → Mitigacja: komunikat o przekroczeniu limitu jest jawny i dotyczy tylko importu fotografa; brak zmiany zachowania dla już działających galerii z gośćmi.
- [Ryzyko: wstrzyknięta funkcja weryfikująca w `initTusServer` zwiększa powierzchnię publicznego API tej funkcji] → Mitigacja: parametr jest opcjonalny z bezpiecznym domyślnym zachowaniem (brak funkcji weryfikującej = każdy upload ze `source: "photographer"` jest odrzucany), więc nie psuje istniejących wywołań `initTusServer(dataDir)` w testach.
