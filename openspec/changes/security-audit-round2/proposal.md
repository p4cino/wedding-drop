# Proposal

## Why

Drugi pełny audyt bezpieczeństwa (OSCP/OSWE level) wykazał 16 realnych podatności (F-01 do F-16, od Critical do Low) obejmujących m.in. zachowanie fail-open w `/media-file/*` połączone z zapisem `ownerToken` w otwartym tekście w plikach metadanych TUS (`tus_temp/<uploadId>.json`), rozszczepienie stanu modułu `auth.ts` (`revokedJtis` i `runtimeFallbackSecret`) pomiędzy `dist/server.js` a trasami Next.js, ominięcie flagi `allowGuestViewing: false`, wyciek niezatwierdzonych plików (`status: "pending"`) przez SSE, obejścia limitera zapytań i limitu przestrzeni dyskowej (`maxStorageBytes`), brak jednorazowości stanu OAuth Google oraz błędy walidacji i nagłówków bezpieczeństwa. Naprawa tych błędów domyka powierzchnię ataku przed wdrożeniem produkcyjnym.

## What Changes

- **Wzmocnienie `/media-file/*` i TUS (F-01, F-03, F-06, F-14, F-15)**: Wymuszenie polityki fail-closed (404 dla plików spoza `media_items` i spoza `galleries/`), weryfikacja `allowGuestViewing` i `isActive`, usuwanie `ownerToken` z metadanych TUS oraz plików `.json` po przetworzeniu, kryptograficznie losowe ID uploadów (`crypto.randomBytes`), nagłówek `Content-Security-Policy: default-src 'none'; sandbox`, usunięcie `.svg` z mapy MIME oraz `Cache-Control: private, no-store` dla chronionych mediów (z wykluczeniem `/media-file/` w Service Workerze).
- **Współdzielony stan autoryzacji i sesji (F-02, F-09, F-10, F-11)**: Przeniesienie `revokedJtis` oraz sekretu zapasowego do `globalThis`, powiązanie tokenu gościa ze skrótem aktualnego `guestPassword`, dodanie możliwości wyczyszczenia `guestPassword` w panelu właściciela, unieważnianie poprzedniego tokenu przy rotacji sesji właściciela, aktualizacja hasła admina przy starcie kontenera gdy `ADMIN_PASSWORD` ulegnie zmianie.
- **Prywatność SSE, limity i OAuth (F-04, F-05, F-07, F-08)**: Blokada emisji zdarzeń SSE `new-media` dla plików `pending` do nieautoryzowanych gości (i emisja po zatwierdzeniu), izolacja kubełków limitera autoryzacji od publicznych, nadpisywanie `X-Forwarded-For` w Caddy, śledzenie rezerwacji bajtów TUS w locie i ponowna weryfikacja limitu w `processMediaTask`, jednorazowość `nonce` i ciasteczko wiążące `state` w OAuth Google.
- **Walidacja kart PDF, MIME i infrastruktury (F-12, F-13, F-16)**: Walidacja DTO w `PUT /api/owner/[slug]/card` i `GET /api/gallery/[slug]/card/pdf`, sanityzacja WinAnsi i kolorów HEX w `pdf-card.ts`, kanoniczny `mimeType` po walidacji magic bytes, doprecyzowanie `cap_add` w Docker Compose, nagłówki HSTS/Permissions-Policy oraz `execFileSync` w `ops-helper.ts`.

### Poza zakresem (Non-goals)

- Przebudowa systemu uwierzytelniania na zewnętrzny dostawca OIDC/JWT lub Redis (zachowujemy lekki model HMAC-SHA256 + PostgreSQL z pojedynczym procesem Node.js).
- Zmiana limitów sprzętowych kolejki `p-queue` (`concurrency: 2`) lub watchdoga FFmpeg (`25s SIGKILL`).

## Capabilities

### New Capabilities

- `security-hardening`: Wymagania bezpieczeństwa dla serwowania plików, sesji HMAC w `globalThis`, ochrony TUS, prywatności SSE, limitów zapytań i pojemności, jednorazowego stanu OAuth oraz walidacji wejścia.

### Modified Capabilities

Brak zmian w istniejących specyfikacjach głównych (`owner-session` i `credential-transport` zachowują swoje kontrakty, w tym `Path=/api` dla ciasteczek właściciela).

## Impact

- **Pakiety**: `@wedding-drop/web`, `@wedding-drop/media`, `@wedding-drop/db`, konfiguracja Docker/Caddy, `README.md` i `DOCUMENTATION.md`.
- **Intel N100**: Zerowy narzut CPU/RAM — rezerwacje bajtów i `revokedJtis`/`consumedStateNonces` w `globalThis` mają stały górny limit wpisów, a strumieniowanie ZIP i `p-queue(2)` pozostają bez zmian.
