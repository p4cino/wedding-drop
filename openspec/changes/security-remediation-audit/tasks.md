# Tasks

## Faza 1: Usprawnienia Modułu Autoryzacji HMAC (C-1, C-2)
- [x] `apps/web/src/lib/auth.ts`: Zmiana implementacji `getAdminSecret()` – jeśli `ADMIN_SECRET` nie jest zdefiniowane, generuj bufor `crypto.randomBytes(32)` raz na proces zamiast zwracać hasło `ADMIN_PASSWORD`. Zabezpieczenie przed twardym hardcodowanym sekretem.
- [x] `apps/web/src/lib/auth.ts`: Zmiana implementacji `generateOwnerToken` i `verifyOwnerToken` / admin: wyliczanie HMAC musi włączać zrekonstruowany (lub zahardcodowany w ciele generatora) typ podmiotu (`admin_` vs `owner_`) lub różnicowe saltingi w wejściowym payloadzie `crypto.createHmac`, tak by podpis dla tego samego ładunku nie był krzyżowo ważny dla innej roli.
- [x] Testy jednostkowe: Napisanie testu w Vitest potwierdzającego, że wyprodukowany token właściciela zostaje odrzucony jako token admina, i odwrotnie.

## Faza 2: Kontrola Serwowania Plików
- [x] `Caddyfile`: Usunięcie całej reguły z `handle_path /media-file/*`. Zapis pliku wymusza kierowanie wszystkich ścieżek przez proxy web:3000.
- [x] `apps/web/server.ts` (lub odpowiednia trasa dla routera, jeśli ujednolicone z `server.ts`): Implementacja interceptora lub Next Route Handler dla ścieżki `/media-file/:filename`. Endpoint ma za zadanie zweryfikować element w bazie `media_items`, upewnić się o braku ataku Path Traversal (rozwiązać przez `path.resolve` + weryfikacja w `/data`) oraz wysłać strumień zwrotny (używając `fs.createReadStream()`) dopiero po potwierdzeniu widoczności pliku.

## Faza 3: Przeciwdziałanie Stored XSS i Serwist
- [x] `packages/media`: Detekcja typów magic bytes podczas zapisywania z uploadera TUS do formatów docelowych (w obszarze obsługi zdarzenia zakończenia uploadu/TUS hooks) i odrzucanie plików przypominających HTML/skrypty mimo zmanipulowanego rozszerzenia pliku.
- [x] `apps/web/sw.ts`: Edycja reguł `runtimeCaching` tak, by zrezygnować z cache API, autoryzacji sesji i wrażliwych payloadów. Dodanie bezwzględnych wyjątków dla `NetworkOnly`.

## Faza 4: Rewizja Dokumentacji
- [x] Aktualizacja pliku `DOCUMENTATION.md` z naciskiem na architekturę bezpieczeństwa i obsługę streamingu przez Node ze względów prywatności galerii.
