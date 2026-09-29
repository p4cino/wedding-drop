# Design

## Context

Porównanie `UploaderDrawer.tsx` (linie ok. 30-52, 99-219, 290-314, 351-440, 458-478) z `PhotographerImportPanel.tsx` (ok. 24-49, 53-139, 161-183, 213-324) pokazuje niemal identyczne bloki. Rozbieżności (throttling, obsługa `justFinished`, render błędu) wyglądają na dryf, nie na świadome decyzje.

## Goals / Non-Goals

**Goals:**
- Jedna implementacja logiki i widoku wiersza/dropzone; różnice tylko w metadanych i tekstach.
- Wyjaśniona, testowana semantyka wyniku kolejki.

**Non-Goals:**
- Równoległość, nowe limity, zmiana protokołu, zmiany po stronie serwera.

## Decisions

- **`uploadFileViaTus` jako czysta funkcja-opakowanie** na `new tus.Upload` zwracająca `Promise<"completed" | "error">`; `onProgress(percent)` wołane po throttlingu wewnątrz funkcji. Endpoint: `${window.location.origin}/api/upload/tus` (jak dziś).
- **`useUploadQueue`** trzyma `items` oraz `phase: "idle" | "uploading" | "done"` (zamiast trzech flag), więc kombinacje niemożliwe (`justFinished && files.length > 0` bez sensu) nie istnieją. `start(metadataFor: (file) => Record<string,string>)` iteruje sekwencyjnie i zwraca `{ completed, failed }`.
- **Komponenty prezentacyjne** `UploadFileRow` (ikona, nazwa, MB przez `formatMegabytes`, `role="progressbar"`, stan błędu) i `FilePickerDropzone` przyjmują teksty jako propsy — unikamy przepinania namespace'ów i18n.
- **Reset:** tylko efekt `!isOpen` w drawerze; usunięcie `resetQueue` i martwego `uploadInstance`.
- **Testy:** `tests/helpers/tus-mock.ts` udostępnia fabrykę mocka; testy hooka/funkcji piszemy raz, testy komponentów upraszczamy do renderu i wiązania.

## Risks / Trade-offs

- [Ryzyko: zmiana semantyki po błędzie w imporcie fotografa (dziś „wszystko wysłane" po porażce)] → Mitigacja: to poprawka błędu, opisana w specyfikacji i pokryta testem; e2e importu (`owner-moderation`) zostaje.
- [Ryzyko: regresja w drawerze gościa, najczęściej używanej ścieżce] → Mitigacja: istniejące testy `UploaderDrawer.test.tsx` (417 linii) zostają i muszą przechodzić bez zmian asercji zachowania.
- [Ryzyko: `i18n` – namespace'y różnią się] → Mitigacja: teksty przekazywane propsami.
