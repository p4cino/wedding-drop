# Design

## Context

Drawer gościa (`apps/web/src/components/UploaderDrawer.tsx`) trzyma `files` w `useState`. Po sukcesie TUS status zmienia się na `completed`, ale pozycje zostają. Komponent przy `isOpen=false` robi `return null` bez unmountu, więc stan przeżywa zamknięcie. Serwer TUS nie deduplikuje — każdy upload to nowy wiersz. Motywacja: zobacz `proposal.md` — Why. Wymagania: `specs/guest-upload/spec.md`.

## Goals / Non-Goals

**Goals:**

- Natychmiastowe czyszczenie kolejki po pełnym sukcesie sesji uploadu.
- Reset kolejki przy każdym zamknięciu drawera (X / Escape / Gotowe).
- Zachowanie możliwości retry przy częściowych błędach.
- Testy jednostkowe pokrywające sukces, partial failure i reopen.

**Non-Goals:**

- Hash/dedup po stronie serwera lub fingerprint przy wyborze z rolki.
- Zmiany w `packages/media` (TUS, kolejka Sharp/FFmpeg).
- Zmiana kontraktu API galerii (brak wpływu na hidden/deleted).

## Decisions

### 1. Czyszczenie w kliencie po pełnym sukcesie (nie po każdym pliku)

Po pętli `startUpload`, gdy żaden plik nie jest w `error`/`pending`/`uploading` (wszystkie sukces), wywołać `setFiles([])` zanim / zamiast polegać na widoku `allCompleted` z listą checkmarków.

- **Alternatywa:** czyścić dopiero przy `onClose` — odrzucona (wybór użytkownika: opcja 2 — natychmiast).
- **Alternatywa:** unmount drawera gdy `!isOpen` — możliwa jako uzupełnienie resetu, ale nie wystarczy sama do „natychmiast po sukcesie”.

### 2. Reset przy zamknięciu

W `onClose` (i przed wywołaniem prop `onClose` z X/Escape/Gotowe) wyczyścić `files` (oraz opcjonalnie zresetować natywny `<input type="file">` przez `value = ""`, żeby ten sam plik dało się wybrać od nowa).

Przycisk „Gotowe” po sukcesie: skoro lista jest już pusta, UI może pokazać krótki stan sukcesu bez listy albo od razu ten sam przycisk zamykający — implementacja powinna unikać martwego `allCompleted && files.length > 0`; po `setFiles([])` warunek `allCompleted` jest false, więc trzeba osobnego flagi `sessionSucceeded` **albo** zamknąć drawer automatycznie po sukcesie. Preferencja designu: flaga `justFinished` (lub równoważna) utrzymująca przycisk „Gotowe” / komunikat sukcesu przy pustej liście, bez ponownego pokazywania starych plików.

### 3. Partial failure

Nie czyścić kolejki, gdy którakolwiek pozycja ma `error`. Opcjonalnie usunąć z listy tylko `completed`, zostawiając `error` — ułatwia retry; zgodne ze scenariuszem „pozycje z błędem pozostają”. Preferowane: po sesji z błędami `setFiles(prev => prev.filter(f => f.status !== "completed"))`.

### 4. Zakres pakietów

Tylko `@wedding-drop/web` — bez nowych zależności i bez zmian w `db`/`media`.

## Risks / Trade-offs

- **[Risk] Utrata podglądu „co poszło” po sukcesie** → Mitigation: krótki komunikat / przycisk „Gotowe” przy pustej liście (`justFinished`); galeria aktualizuje się przez SSE/`onUploadSuccess`.
- **[Risk] Race: `setFiles` z `onSuccess` vs bulk clear** → Mitigation: clear dopiero po zakończeniu całej pętli await, na podstawie końcowego stanu (odczyt przez functional update lub lokalny tracker sukcesów/błędów w `startUpload`).
- **[Risk] Testy/E2E zakładają listę completed** → Mitigation: zaktualizować asercje w `UploaderDrawer.test.tsx` i sprawdzić E2E gościa.

## Migration Plan

- Deploy jak zwykle (frontend w obrazie web); brak migracji DB.
- Rollback: poprzedni obraz przywraca stare UX (lista zostaje) — bez skutków ubocznych danych.
