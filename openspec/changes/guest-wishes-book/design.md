# Design

## Context

Zobacz `proposal.md` — sekcja „Why”. Dzisiejszy wzorzec moderacji (`media_items.status`: `ready`/`hidden`/`deleted`, filtrowanie w `GET /api/gallery/[slug]/media`, aktualizacja w `PATCH /api/owner/[slug]/media/[id]/status` z użyciem `authenticateOwner`, powiadomienie przez `sseBus.notifyMediaUpdated`) jest bezpośrednim wzorcem do skopiowania dla życzeń — ten sam kształt stanu, ta sama autoryzacja, ten sam mechanizm powiadomień na żywo.

## Goals / Non-Goals

**Goals:**
- Życzenia współdzielą wzorzec autoryzacji/moderacji z `media_items`, więc nowy kod przegląda się identycznie jak istniejący (mniejsze ryzyko błędu, łatwiejszy przegląd kodu).
- Zero zmian w potoku przetwarzania multimediów — życzenia to zwykłe operacje CRUD na bazie danych.

**Non-Goals:**
- Brak wspólnej tabeli `content_items` łączącej media i życzenia w tej iteracji — osobna tabela `wishes` jest prostsza i nie ryzykuje regresji w już dobrze przetestowanym `media_items` (indeksy, migracje, kod ZIP-a).

## Decisions

- **Nowa tabela `wishes`** (`packages/db/src/schema.ts`): `id` (uuid), `galleryId` (fk → `galleries.id`, `onDelete: cascade`), `guestName` (text, nullable — "Anonimowy gość" jako domyślna wartość wyświetlana w UI, nie w bazie), `message` (text, wymagane), `status` (text, domyślnie `ready`), `createdAt`. Indeks `(galleryId, status, createdAt)` analogiczny do `idx_media_items_gallery_status_created`, bo zapytania mają identyczny kształt (lista życzeń danej galerii, filtrowana po statusie, sortowana chronologicznie).
- **Nowy `insertWishSchema`/`addWishDto` w `packages/db/src/validators.ts`** z limitem długości `message` (np. 500 znaków, spójne z `customInstructions`) i `guestName` (max 60 znaków, spójne z `uploaderName` w `tusUploadMetadataDto`) — reużycie istniejących konwencji Zod zamiast nowego stylu walidacji.
- **Trasy API kopiujące istniejący kształt:**
  - `POST /api/gallery/[slug]/wishes` — publiczne dodanie (wzorzec: brak auth, jak `POST_FINISH` w TUS), zwraca 400 przy pustej/zbyt długiej treści lub nieaktywnej/nieistniejącej galerii.
  - `GET /api/gallery/[slug]/wishes` — publiczna lista, ten sam parametr `includeHidden` + `ownerToken`/`password`/`adminToken` co `GET /api/gallery/[slug]/media`, reużywając `verifyOwnerToken`/`verifyAdminToken` z `@/lib/auth`.
  - `PATCH /api/owner/[slug]/wishes/[id]/status` — kopia `PATCH /api/owner/[slug]/media/[id]/status`, używa `authenticateOwner`.
- **Rozszerzenie `sseBus`** (`packages/media/src/sse-bus.ts`) o `notifyNewWish(gallerySlug, wish)` i `notifyWishUpdated(gallerySlug, update)`, emitujące `new-wish:${slug}`/`wish-updated:${slug}` — SSE route (`GET /api/gallery/[slug]/live`) dopisuje nasłuch na te zdarzenia obok istniejących trzech, tym samym wzorcem `sseBus.on(...)`/`off(...)` przy `abort`.
- **Eksport życzeń jako osobny plik tekstowy w istniejącym strumieniu ZIP**, a nie osobny endpoint pobierania — `createGalleryZipStream` w `zip-streamer.ts` dostaje opcjonalny parametr `wishesText: string | undefined`, i jeśli podany, dogrywa go do archiwum jako `zyczenia.txt` (jedna, prosta operacja `archive.append(text, { name })`, zgodna z istniejącym stylem strumieniowania bez buforowania całego archiwum).

## Risks / Trade-offs

- [Ryzyko: duplikacja logiki auth/moderacji między `media` a `wishes` (dwa niemal identyczne zestawy tras) zwiększa powierzchnię do utrzymania] → Mitigacja: świadomy wybór (patrz Non-Goals) — scalenie w jedną tabelę polimorficzną byłoby przedwczesną abstrakcją przy tylko dwóch typach treści i skomplikowałoby dobrze przetestowany kod mediów; można to zrewidować, jeśli pojawi się trzeci podobny typ treści.
- [Ryzyko: spam/nadużycia w polu wolnego tekstu (brak captchy, brak limitu częstotliwości)] → Mitigacja: identyczne ryzyko istnieje już dziś przy polu podpisu (`uploaderName`) przy uploadzie zdjęć — projekt świadomie ufa, że dostęp do galerii mają tylko zaproszeni goście ze skanu QR (ten sam model zaufania co reszta aplikacji); moderacja właściciela (ukryj/usuń) to istniejący mechanizm naprawczy.
- [Ryzyko: rozrost `sse-bus.ts` o kolejne typy zdarzeń] → Mitigacja: zachowany identyczny wzorzec nazewnictwa (`<zdarzenie>:${slug}`) i identyczny cykl życia nasłuchu/sprzątania, więc czytelność się nie pogarsza mimo dodania dwóch nowych zdarzeń.
