# Proposal

## Why
Podczas niedawnego audytu bezpieczeństwa zidentyfikowano szereg krytycznych i poważnych podatności, które wymagają natychmiastowej naprawy.
Główne z nich to (C-1 i C-2):
1. Podatność na fałszowanie tokenów autoryzacyjnych (Token Prefix Swap) – funkcje `verifyAdminToken` i `verifyOwnerToken` korzystają z tego samego klucza i algorytmu HMAC-SHA256 bez weryfikacji stałego przedrostka podczas walidacji MAC, co umożliwia eskalację uprawnień z Właściciela na Administratora.
2. Twardy fallback klucza HMAC (HMAC Key Fallback) – brak ustawionej zmiennej środowiskowej `ADMIN_SECRET` skutkuje użyciem wartości `ADMIN_PASSWORD` (domyślnie `admin123`) jako klucza HMAC dla całej instancji.
Ponadto wykazano brak uwierzytelniania w serwowaniu plików multimedialnych (Caddy służy pliki bezpośrednio z pominięciem reguł `status: hidden`), cachowanie wrażliwych endpointów API przez Service Worker (Serwist), oraz luki w walidacji załączników w protokole TUS (wektor Stored XSS w paczkach HTML).

## What Changes
1. **Rozdzielenie kluczy HMAC i funkcji weryfikujących** (`apps/web/src/lib/auth.ts`): Tokeny właściciela i administratora muszą korzystać z odseparowanych danych wejściowych w funkcji MAC (np. poprzez dołączenie nazwy roli do wiadomości weryfikującej) lub osobnych sekretów w konfiguracji.
2. **Bezpieczny fallback kluczy**: Zmiana fallbacku w `auth.ts` tak, by brak `ADMIN_SECRET` używał kryptograficznie bezpiecznej i losowej wartości w pamięci RAM (`crypto.randomBytes`) zamiast statycznego hasła z env.
3. **Zabezpieczenie serwowania plików**: Aktualizacja pliku `Caddyfile` zdejmująca wystawienie katalogu `/data` bezpośrednio. Dodanie autoryzowanej logiki streamingu do instancji Next.js / HTTP (Node.js) z zachowaniem weryfikacji w bazie (zablokowanie widoku usuniętych i ukrytych zasobów).
4. **Rozszerzona weryfikacja plików upload**: Dodanie detekcji sygnatury pliku dla paczek przechodzących przez `packages/media` (TUS endpoint), uniemożliwiające podszywanie się HTML pod media i chroniące origin przed Stored XSS.
5. **Poprawka konfiguracji Serwist**: Dodanie reguł `NetworkOnly` (lub pomijania) w konfiguracji `sw.ts` dla wszystkich autoryzowanych endpointów `/api/*`.

## Capabilities

### Modified Capabilities
- Bezpieczny i kryptograficznie izolowany mechanizm HMAC.
- Zamknięty obwód serwowania statycznych plików (każdy odczyt przechodzi przez aplikację z weryfikacją `status`).
- Wyeliminowany wektor przetrzymywanych skryptów XSS z plików mediów.

## Impact
- **Pliki:** `apps/web/src/lib/auth.ts`, `Caddyfile`, konfiguracja cachingu PWA, endpointy TUS/media.
- **Bezpieczeństwo:** Całkowite mitygowanie głównych krytycznych wektorów wymienionych w audycie z września/października 2026.
- **N100:** Przeniesienie obsługi strumieniowania mediów z Caddy do Node.js podniesie konsumpcję cykli procesora podczas przeglądania galerii, co wymaga zaimplementowania wydajnego streamingu asynchronicznego omijającego całkowicie bufory w RAM (`fs.createReadStream` + pipes).

## Non-goals / Poza zakresem
- Konfiguracja dodatkowych Web Application Firewall (WAF) ani wchodzenie w infrastrukturę zewnętrzną.
- Poprawki z zakresu Rate Limiting (to stanowić będzie odrębny spec optymalizacji sprzętowej i przepustowości).
