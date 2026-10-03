# Design

## Context
Aplikacja została poddana kompleksowemu audytowi bezpieczeństwa. Wykryto luki C-1 i C-2, związane z nadużyciem i nieostrożną implementacją podpisów HMAC (zastępujące je fallbacki oraz możliwość maskowania typu sesji z Właściciela na Administratora poprzez token swap). Ponadto audyt wykazał luki PWA (Serwist cachujący odpowiedzi `/api/`) i Caddy serwujące bezpośrednio zawartość wrażliwą (omijając blokady nałożone w panelu takie jak zablokowane z powodu prywatności pliki).

## Goals / Non-Goals

**Goals:**
- Całkowita poprawa kryptograficzna dla sesji HMAC (C-1, C-2).
- Zablokowanie swobodnego dostępu z sieci do serwowanych zdjęć bez odpytania bazy o `status`.
- Weryfikacja sygnatur (magic bytes) uderzających w platformę po TUS przed zapisaniem na dysku, w celu mitygacji Stored XSS.
- Wykluczenie krytycznych ścieżek Next.js z Serwist SW.

**Non-Goals:**
- Nie implementujemy tutaj logowania i wylogowania po stronie serwera ani zmian koncepcyjnych w istnieniu długoterminowych tokenów (zmiany te podlegały innemu specowi).
- Nie implementujemy deduplikacji zasobów (osobny spec).

## Decisions

1. **Rozwiązanie C-1 i C-2 (auth.ts):**
   - Dodamy oddzielny `getOwnerSecret()`, lub w przypadku braku dedykowanego secretu w `.env`, wygenerujemy `crypto.randomBytes(32)` na start procesu w zmiennej in-memory dla fallbacku. 
   - W `verifyAdminToken` i `verifyOwnerToken` musimy zmienić logikę weryfikacji: przy dekonstrukcji `[prefix, payload, mac]` weryfikujemy czy `prefix` bezwzględnie się zgadza (np. `admin_` lub `owner_`), ale co ważniejsze, proces wyliczania mac-a dla potwierdzenia musi na nowo uwzględniać ten zrekonstruowany prefix z danymi wejściowymi zamiast ślepo weryfikować go obok.
   - Od teraz, gdy zmienna `ADMIN_SECRET` w systemie Windows lub Dockerze nie jest ustawiona, aplikacja wystartuje z ulotnym tokenem do końca działania kontenera.

2. **Caddy i ukryte media:**
   - W `Caddyfile` usunięty zostanie w pełni blok `handle_path /media-file/*`. Ruch trafi domyślnie na rewers do usługi web:3000.
   - Serwer Next.js (lub `server.ts`) obsłuży `GET /media-file/[filepath]`. Ścieżka podana z zewnątrz będzie walidowana wyrażeniem `^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$` w nazwie i sprawdzana w tabeli `media_items` (pakiet `@wedding-drop/db`). Jeśli zasób posiada status `hidden` lub `deleted`, zwracane jest `403 Forbidden` / `404 Not Found` chyba że w requeście znajduje się ważny token Admina/Właściciela.
   - Stream do odpowiedzi odbywać się będzie tylko przez `fs.createReadStream`, zachowując zasady platformy N100 odnośnie małej dostępności pamięci (zero pełnych buforów Node.js).

3. **Pliki XSS i Magic Bytes (TUS media pipeline):**
   - Po finalizacji pliku (TUS EVENT_POST_FINISH lub odpowiednik pakietu media), należy odczytać pierwsze od 4 do 12 bajtów z dysku (np. pakietem `file-type` ew. dedykowaną logiką pod zaledwie `jpg/png/mp4/heic`), zweryfikować czy zgadza się to ze stanem faktycznym i zablokować serwowanie / usunąć go, jeśli ewidentnie plik HTML został podstawiony jako udające rozszerzenie obrazka.

4. **Serwist Cache:**
   - Poprawimy `apps/web/sw.ts` blokując runtime caching w strategiach NetworkFirst dla URL-i zawierających autoryzacyjny kontekst.

## Risks / Trade-offs

- **Obciążenie CPU dla /media-file/:** Caddy napisany w Go był skrajnie lekki dla serwowania statycznego. Node.js podwyższy latencje i zużycie zasobów. **Mitigacja:** Baza postgres oraz pliki trzymane są po lokalnym SSD; zapytania `SELECT id FROM media_items WHERE path = $1 AND status = 'visible' LIMIT 1` mogą posiadać index i zwracać błyskawiczne wyniki przed rozpoczęciem strumieniowania z dysku.
- Ulotne klucze dla braku `.env` wywołają konieczność ponownego logowania klientów po każdym restarcie kontenera Node, ale jest to sytuacja o 100% poprawniejsza kryptograficznie (defaultowe hasła były rażącym naruszeniem C-2).
