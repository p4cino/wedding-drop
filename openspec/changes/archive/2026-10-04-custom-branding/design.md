# Design

## Context

Obecnie wygląd galerii dla gości polega na wyświetlaniu imion pary młodej jako głównego nagłówka i standardowego, jednolitego tła. Zgodnie z `proposal.md`, wprowadzamy możliwość wgrywania własnego logo oraz tła. Pliki te różnią się od zdjęć gości – są przesyłane rzadko, przez właściciela i mają zazwyczaj mały rozmiar.

## Goals / Non-Goals

**Goals:**
- Rozszerzenie schematu bazy danych (w `packages/db`) o tabelę powiązaną 1:1 z główną galerią w celu przechowywania informacji o logo i tle.
- Stworzenie bezpiecznego, omijającego TUS mechanizmu wgrywania małych plików konfiguracyjnych (tzw. plików systemowych) przez właściciela galerii.
- Serwowanie wgranych plików publicznie gościom w bezpieczny sposób.

**Non-Goals:**
- Nie integrujemy wgrywania logo i tła z TUS (TUS-js-client), ponieważ pliki są małe i nie wymagają możliwości wznawiania (resumability).
- Nie przepuszczamy logo/tła przez kolejkę `p-queue` z FFmpeg/Sharp – zakładamy, że właściciel może wgrać gotowe logo (z ograniczeniem wielkości pliku).

## Decisions

### 1. Schemat Bazy Danych
Tworzymy nową tabelę `gallery_branding` w `packages/db/src/schema.ts`:
- `id` (uuid, PK)
- `galleryId` (uuid, FK do `galleries.id`, unique)
- `logoPath` (text, opcjonalne)
- `backgroundPath` (text, opcjonalne)
- `createdAt`, `updatedAt`

*Dlaczego osobna tabela?* Zamiast dodawać kolejne kolumny do `galleries`, utrzymujemy domenę ustawień wyglądu w osobnej tabeli (podobnie jak `card_settings`).

### 2. Mechanizm Wgrywania i Przechowywania (Upload)
Endpoint `POST /api/owner/[slug]/branding` oparty o standardowe `multipart/form-data` w Next.js.
- Endpoint zwaliduje typ MIME (np. `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`) oraz wielkość pliku (maksymalnie np. 5 MB).
- Plik zostanie zapisany fizycznie na dysku w ścieżce: `/data/galleries/[slug]/branding/logo.[ext]`. Do budowania ścieżek użyjemy `path.posix.join` zgodnie z ograniczeniami architektury.

*Alternatywy:* Użycie TUS. Odrzucone ze względu na narzut konfiguracji TUS po stronie klienta dla prostego formularza ustawień.

### 3. Serwowanie plików brandingowych
Logo i tło muszą być widoczne dla gości (niezalogowanych). Zostaną serwowane przez zoptymalizowany pod kątem bezpieczeństwa endpoint lub handler w `server.ts` (np. endpoint `/branding-file/:slug/:type`), który wykona `path.resolve()` i kategorycznie sprawdzi, czy wyjściowa ścieżka nie wychodzi poza `/data` (zabezpieczenie przed Path Traversal). Pliki brandingowe z zasady nie mogą mieć statusu "hidden" czy "deleted", więc reguła prywatności nie ma tu zastosowania (są to zasoby publicznie widoczne dla każdego gościa galerii).

### 4. Integracja z UI (Frontend)
Widok `/g/[slug]` oraz komponenty nawigacji pobiorą informacje o brandingu i użyją CSS do podmiany tła (np. `backgroundImage`, `backgroundSize: cover` w Panda CSS) oraz komponentu `<img />` zamiast tekstu z imionami pary.

## Risks / Trade-offs

- **[Ryzyko]** Użytkownik wgra złośliwy plik (np. udający SVG) prowadzący do ataków XSS. 
  → **Mitygacja**: Walidacja MIME typu po stronie serwera, restrykcyjny nagłówek `Content-Type` podczas serwowania pliku oraz ewentualnie blokada uploadu czystego SVG bez oczyszczenia, polegając głównie na formatach rastrowych (PNG/JPG/WEBP).
- **[Ryzyko]** Przekroczenie limitów dysku na N100 przez ataki DoS na nowy endpoint.
  → **Mitygacja**: Endpoint `POST /api/owner/...` będzie zabezpieczony silnym mechanizmem weryfikacji tożsamości z użyciem `crypto.timingSafeEqual` przychodzącym z `authenticateOwner()`. Właściciel jest podmiotem zaufanym.
