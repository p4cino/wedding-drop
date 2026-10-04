# Tasks

## 1. Aktualizacja schematu bazy danych

- [x] 1.1 Dodanie kolumn konfiguracyjnych do `galleries` (`guestPassword`, `isApprovalQueueEnabled`, `allowGuestUploads`, `allowGuestViewing`) w `packages/db/src/schema.ts` i aktualizacja typów oraz zweryfikowanie poprawnej kompilacji projektu za pomocą `pnpm check-types`.
- [x] 1.2 Generowanie migracji SQL dla nowych kolumn za pomocą komendy Drizzle Kit (`pnpm run db:generate`) i potwierdzenie utworzenia odpowiedniego pliku w folderze migracji.
- [x] 1.3 Aktualizacja `tests/unit/api/gallery.test.ts` lub podobnych testów jednostkowych o nowe pola w mockach/bazie testowej i zweryfikowanie czy testy wciąż przechodzą pomyślnie na starym schemacie.

## 2. Implementacja sesji i hasła gościa (Ochrona galerii)

- [x] 2.1 Stworzenie logiki w `apps/web/src/lib/auth.ts` do weryfikacji i generowania bezpiecznych tokenów JWT / HMAC dla gości na podstawie hasła gościa (PIN) używając `crypto.timingSafeEqual` i zweryfikowanie nowej metody testami jednostkowymi.
- [x] 2.2 Zabezpieczenie layoutu gościa `apps/web/src/app/[locale]/g/[slug]/layout.tsx` mechanizmem wymuszającym logowanie, jeśli galeria wymaga hasła, i zweryfikowanie renderowania ekranu logowania w przeglądarce.
- [x] 2.3 Implementacja endpointu autoryzacji gościa (`POST /api/gallery/[slug]/auth`), który weryfikuje hasło, wstawia ciasteczko z sesją gościa i zwraca 200 OK lub 401 Unauthorized, z weryfikacją poprawnym testem API.

## 3. Implementacja szczegółowych uprawnień

- [x] 3.1 Zabezpieczenie widoczności siatki zdjęć: Ograniczenie wyświetlania w `apps/web/src/app/[locale]/g/[slug]/page.tsx` w zależności od kolumny `allowGuestViewing` i walidacja warunku w teście Playwright.
- [x] 3.2 Ograniczenie przesyłania plików: zablokowanie endpointu TUS / zapisu bazy, jeśli `allowGuestUploads` jest fałszywe, i weryfikacja zablokowania przycisku w interfejsie gościa.
- [x] 3.3 Walidacja w `media-file-handler.ts`, aby wymusić weryfikację sesji gościa podczas pobierania każdego chronionego pliku, gdy uwierzytelnienie jest wymagane, z weryfikacją pobrania (200 vs 403) dla plików statycznych w Vitest.

## 4. Implementacja Kolejki Akceptacji (Approval Queue)

- [x] 4.1 Zmiana w rurze uploadu TUS (`packages/media` / `apps/web/server.ts` / handler po udanym uploadzie) - ustawienie stanu `pending` zamiast `ready` dla nowych plików, gdy `gallery.isApprovalQueueEnabled` to true. Zweryfikowanie zachowania poprawnym zapytaniem do bazy w testach integracyjnych.
- [x] 4.2 Zabezpieczenie endpointów odczytu i widoczności, tak aby goście (bez dostępu właściciela) nie mogli odpytać serwera o pliki w stanie `pending` poprzez publiczne API, i przetestowanie braku w wyciekach statusów.
- [x] 4.3 Stworzenie widoku/filtra oczekujących plików w Owner Panel (`apps/web/src/app/[locale]/owner/[slug]/page.tsx` -> nowa karta w UI) z przyciskiem zatwierdzenia plików oraz aktualizacją testów widoku komponentu (Vitest).

## 5. Konfiguracja w panelu właściciela (UI)

- [x] 5.1 Aktualizacja `buildOwnerPanelPayload` o nowo dodane pola w `galleries` by front-end otrzymywał dane konfiguracyjne do formularza i zweryfikowanie odpowiedzi API w testach integracyjnych.
- [x] 5.2 Utworzenie i wpięcie nowego komponentu w panelu właściciela (`ModerationSettingsPanel`) do zarządzania nowymi flagami (np. toggles dla uprawnień) oraz zmiana haseł gości; weryfikacja wizualna w przeglądarce i za pomocą mocków w testach.

## 6. Dokumentacja

- [x] 6.1 Zgodnie z AGENTS.md §7, aktualizacja pliku `README.md` oraz ew. dokumentacji użytkownika o nowo wprowadzone uprawnienia, kolejkę moderacji i zahasłowanie, z weryfikacją poprawnego sformatowania tekstu Markdown (np. komendą markdown lint, jeśli istnieje, lub odczytem wzrokowym).
