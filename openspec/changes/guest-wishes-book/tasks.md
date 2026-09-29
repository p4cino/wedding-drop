# Tasks

## 1. Schemat bazy danych i walidatory

- [x] 1.1 Dodaj tabelę `wishes` do `packages/db/src/schema.ts` (pola i indeks jak w design.md) i wygeneruj migrację przez `pnpm --filter @wedding-drop/db db:generate`, weryfikując, że plik migracji powstał
- [x] 1.2 Zastosuj migrację lokalnie (`pnpm db:push`) i zweryfikuj `pnpm --filter @wedding-drop/db test` (istniejący pakiet testów schematu przechodzi bez zmian) — `pnpm --filter @wedding-drop/db test` przechodzi (36/36); migracja `0002_sharp_stardust.sql` zweryfikowana na żywym Postgresie w stacku Docker e2e (`docker exec wedding_postgres_wd3 psql ... \d wishes` potwierdza kolumny, indeks `idx_wishes_gallery_status_created` i FK `wishes_gallery_id_galleries_id_fk`)
- [x] 1.3 Dodaj `insertWishSchema`/`selectWishSchema` (drizzle-zod) oraz `addWishDto` w `packages/db/src/validators.ts` z limitami długości opisanymi w design.md i zweryfikuj nowym testem jednostkowym walidacji (puste `message`, zbyt długie `message`, zbyt długie `guestName`)

## 2. API: dodawanie i listowanie życzeń

- [x] 2.1 Zaimplementuj `POST /api/gallery/[slug]/wishes` (publiczny, waliduje `addWishDto`, odrzuca dla nieaktywnej/nieistniejącej galerii) i zweryfikuj testem integracyjnym happy-path oraz przypadków błędnych (400/404)
- [x] 2.2 Zaimplementuj `GET /api/gallery/[slug]/wishes` kopiując wzorzec autoryzacji z `GET /api/gallery/[slug]/media` (`includeHidden`, `ownerToken`/`password`/`adminToken`) i zweryfikuj testem integracyjnym, że gość bez poświadczeń nie widzi `hidden`/`deleted`
- [x] 2.3 Rozszerz `sse-bus.ts` o `notifyNewWish`/`notifyWishUpdated` i podłącz nasłuch w `GET /api/gallery/[slug]/live` i zweryfikuj testem integracyjnym, że zdarzenie SSE zostaje wyemitowane po dodaniu życzenia

## 3. Moderacja właściciela

- [x] 3.1 Zaimplementuj `PATCH /api/owner/[slug]/wishes/[id]/status` kopiując `authenticateOwner` z istniejącej trasy mediów i zweryfikuj testem integracyjnym zmianę statusu na `hidden`/`ready` z poprawnymi i niepoprawnymi poświadczeniami
- [x] 3.2 Zaimplementuj status `deleted` dla życzeń poprzez ten sam endpoint PATCH (soft-delete, spójnie z design.md — życzenia nie mają plików do fizycznego usunięcia) i zweryfikuj testem integracyjnym, że usunięte życzenie znika z każdego odczytu, łącznie z widokiem właściciela

## 4. UI gościa i właściciela

- [x] 4.1 Dodaj zakładkę "Życzenia" w `apps/web/src/app/[locale]/g/[slug]/page.tsx` z formularzem dodawania (treść + opcjonalne imię) i listą życzeń zasilaną SSE, i zweryfikuj manualnie dodanie życzenia i jego natychmiastowe pojawienie się
- [x] 4.2 Dodaj sekcję moderacji życzeń w `apps/web/src/app/[locale]/owner/[slug]/page.tsx` (lista z przyciskami ukryj/usuń), reużywając stylistyki `MediaGridWithModeration.tsx`, i zweryfikuj manualnie ukrycie/usunięcie życzenia
- [x] 4.3 Dodaj nowe klucze tłumaczeń (PL/EN/DE) dla formularza i listy życzeń w `apps/web/messages/*.json` i zweryfikuj `pnpm --filter @wedding-drop/web check-types` oraz manualny podgląd w każdym języku

## 5. Eksport i testy end-to-end

- [x] 5.1 Rozszerz `createGalleryZipStream` w `zip-streamer.ts` o opcjonalny parametr `wishesText` dopisujący `zyczenia.txt` do archiwum i zweryfikuj testem jednostkowym zawartości wygenerowanego archiwum
- [x] 5.2 Podłącz budowanie `wishesText` (lista widocznych życzeń sformatowana jako tekst) w `GET /api/gallery/[slug]/zip/route.ts` i zweryfikuj testem integracyjnym, że pobrany ZIP zawiera plik z życzeniami
- [x] 5.3 Dodaj scenariusz Playwright w `apps/web/e2e/guest-journey.spec.ts` (dodanie życzenia i weryfikacja jego widoczności) oraz w `apps/web/e2e/owner-moderation.spec.ts` (ukrycie/usunięcie życzenia) i zweryfikuj przejście obu testów — scenariusze UC8/UC9 dodane w obu plikach. Pełny zestaw Playwright uruchomiony przeciw realnemu stackowi Docker (`wd3`, żywy Postgres, seed galerii `kasia-i-tomek` przez prawdziwe REST API): **89/111 passed**, wszystkie 4 nowe scenariusze życzeń × 3 przeglądarki (12/12) przechodzą bez błędu na Desktop Chromium, Mobile Chrome i Mobile Safari. Pozostałe 22 niepowodzenia to w 100% znane, przedistniejące na `main` problemy niezwiązane z tą funkcją (rozjazd i18n prefiksu `/pl` w linkach, niejednoznaczne dopasowania strict-mode w istniejących testach mediów, mismatch parametru tokenu ZIP, z-index modala panelu admina tylko na Mobile Chrome) — potwierdzone jeden do jednego z listą znanych problemów przekazaną przez koordynatora
- [x] 5.4 Zaktualizuj `README.md` (sekcje "Dla Gości" i "Dla Pary Młodej") oraz `DOCUMENTATION.md` (schemat bazy, lista endpointów) zgodnie z AGENTS.md §7 i zweryfikuj, że opis odzwierciedla faktyczne zachowanie
