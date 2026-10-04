# Design

## Context
Rozszerzenie systemu WeddingDrop o opcjonalne funkcje moderacji (tzw. Advanced Moderation), które zapewniają większą kontrolę nad udostępnianymi materiałami. Zmiany te nie mogą naruszać domyślnego, bezstykowego przepływu pracy (tzw. zero-friction) dla użytkowników. Mechanika streamingu ZIP i ograniczenia sprzętowe dla N100 z `AGENTS.md` (np. concurrency=2 dla p-queue, watchdog) pozostają bez zmian. Projekt bazuje na `packages/db` oraz `apps/web`. Dodatkowe informacje znajdują się w `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Rozszerzenie tabeli `galleries` o kolumny konfiguracyjne: `guestPassword`, `isApprovalQueueEnabled`, `allowGuestUploads`, `allowGuestViewing` (lub modyfikacja na jedno pole typu `accessMode`).
- Wdrożenie statusu `pending` dla tabeli `mediaItems` (która obecnie ma `ready`, `hidden`, `deleted`).
- Ochrona endpointów przed nieautoryzowanym dostępem, gdy `guestPassword` jest wymagane. Wymagana autoryzacja za pomocą prostej sesji gościa (np. plik cookie).
- Wzbogacenie panelu właściciela (w `apps/web`) o zarządzanie kolejką (filtrowanie po statusie `pending`) i konfigurację ustawień.

**Non-Goals:**
- Modyfikacje w kodzie Caddy lub zewnętrznym rewers proxy.
- Rejestrowanie użytkowników lub wprowadzanie ról (jest tylko hasło ogólne do danej galerii).
- Implementacja sztucznej inteligencji do analizy treści uploadowanych plików.

## Decisions

1. **Rozszerzenie schematu bazy danych (packages/db)**: 
   - W tabeli `galleries` zostaną dodane:
     - `guestPassword` (text) - przechowuje hasło zabezpieczające dostęp (puste oznacza brak zabezpieczenia). Ze względów bezpieczeństwa najlepiej przechować zwykły PIN lub hash (hash jest bezpieczniejszy).
     - `isApprovalQueueEnabled` (boolean, domyślnie `false`) - czy nowe pliki trafiają do kolejki akceptacji.
     - `allowGuestUploads` (boolean, domyślnie `true`) - czy goście mogą wrzucać pliki.
     - `allowGuestViewing` (boolean, domyślnie `true`) - czy goście widzą siatkę.
   - W tabeli `mediaItems`, pole `status` w modelu to zwykłe pole tekstowe (nie wbudowany ENUM Postgresa), więc dodanie wartości `pending` odbywa się wyłącznie na poziomie walidacji w kodzie aplikacji. Statusy to: `ready` (widoczny), `hidden` (ukryty), `deleted` (usunięty), `pending` (oczekujący na akceptację).

2. **Ochrona Hasłem i Sesja Gościa (Guest Session)**: 
   - Ponieważ dostęp z hasłem wymaga śledzenia stanu, na wejściu do zabezpieczonej galerii gość będzie poproszony o PIN/hasło. 
   - Poprawne wprowadzenie hasła wygeneruje zakodowany plik cookie (np. `wd_guest_session_<slug>`), weryfikowany w `layout.tsx` oraz API z użyciem istniejącego `verifyOwnerToken` (lub nowego analogicznego rozwiązania HMAC dla gościa). Czas życia cookie będzie równy czasowi życia galerii lub 24 godziny. 
   - Hasło (PIN) w bazie może być przechowywane w formie zahashowanej (np. sha256), a porównanie musi używać `crypto.timingSafeEqual`, by spełnić zasady konstytucji.

3. **Logika Kolejki Akceptacji**: 
   - Zmiana w pipeline TUS (`apps/web/src/app/api/gallery/[slug]/media/route.ts` lub podobnym pliku). Podczas tworzenia rekordu `mediaItem`, jeśli `gallery.isApprovalQueueEnabled === true`, system ustawi `status: "pending"`.
   - Endpointy odczytujące dla gości (`GET /api/gallery/[slug]/media`) automatycznie filtrują po `status === "ready"`.
   - Nowy interfejs w Owner Panel (`apps/web/src/app/[locale]/owner/[slug]/page.tsx`) z zakładką/filtrem "Oczekujące (N)", pozwalający grupowo zmienić status na `ready`.

## Risks / Trade-offs

- [Risk] Utrata płynności na słabym łączu weselnym z uwagi na ekran logowania z PINem. 
  - *Mitigation*: Wymaganie hasła pozostaje opt-in i jest wyłączone dla istniejących galerii. Sesja jest trwała na urządzeniu (brak wylogowywania podczas imprezy).
- [Risk] Zapętlenie/wyciek informacji z podglądem miniaturek plików `pending`.
  - *Mitigation*: Pliki serwowane w `media-file-handler.ts` już odrzucają ukryte zasoby. Zostanie dodany warunek blokujący status `pending` przed nieautoryzowanym pobraniem, podobnie jak `hidden`.

## Migration Plan

Wdrożenie nowej migracji w `packages/db/migrations` za pomocą Drizzle Kit po dodaniu kolumn: `pnpm run db:generate`. Ze względu na ustawienia opt-in (`default(false)` lub `default(true)` dla odpowiednich kolumn), nie ma problemów z kompatybilnością istniejących danych. Nowe wartości pola `status` nie wymagają zmian struktury w bazie.

## Open Questions

- Czy interfejs dla `pending` w panelu właściciela powinien być zupełnie osobną zakładką, czy tylko odfiltrowaną kategorią w siatce zdjęć? *Założono osobny widok z możliwością szybkiego zatwierdzania.*
