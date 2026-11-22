# Tasks

## 1. Schemat bazy danych, walidatory Zod i potok TUS/SSE (`packages/db`, `packages/media`)

- [x] 1.1 Rozszerzyć schemat Drizzle w `packages/db/src/schema.ts` o kolumny `likesCount` (`integer`, default `0`, not null), `caption` (`text`, nullable) i `questId` (`text`, nullable) w tabeli `media_items` oraz `questsConfig` (`jsonb`, nullable) w tabeli `galleries`, wygenerować migrację Drizzle i zweryfikować kompilację typów `pnpm --filter @wedding-drop/db check-types`.
- [x] 1.2 Rozszerzyć `packages/db/src/validators.ts` o walidatory `caption` (max 140 znaków) i `questId` (`^[a-z0-9_-]{1,40}$`) w `tusUploadMetadataDto`, schemat `questsConfigDto` (max 20 wyzwań, tytuły 2–80 znaków) oraz `toggleMediaLikeDto` (`action: "like" | "unlike"`), wraz z testami jednostkowymi Vitest w `packages/db` (`pnpm --filter @wedding-drop/db test`).
- [x] 1.3 Zaktualizować `packages/media/src/tus-server.ts`, `packages/media/src/media-processor.ts` oraz `packages/media/src/sse-bus.ts`: przekazywać `caption` i `questId` do `scheduleMediaProcessing` (z weryfikacją istnienia `questId` w aktywnym `gallery.questsConfig`), dodać metodę `sseBus.notifyMediaLiked(gallerySlug, { mediaId, likesCount })` i zweryfikować testami jednostkowymi `pnpm --filter @wedding-drop/media test`.

## 2. Backend API i stan na żywo SSE dla reakcji, wyzwań i podpisów (`apps/web`)

- [x] 2.1 Utworzyć endpoint `POST /api/gallery/[slug]/media/[id]/like` w `apps/web/src/app/api/gallery/[slug]/media/[id]/like/route.ts` z ochroną prywatności (`isActive`, `allowGuestViewing`, `guestPassword`, tylko dla `status === "ready"`), izolowanym rate-limitingiem w `publicStore`, atomową aktualizacją `likesCount` (`GREATEST(0, ...)`) oraz emisją zdarzenia SSE `media-liked`, i zweryfikować działanie testami jednostkowymi route handlera w Vitest.
- [x] 2.2 Zaktualizować `GET /api/gallery/[slug]/media`, `GET /api/gallery/[slug]/live`, `GET /api/gallery/[slug]`, `PATCH /api/owner/[slug]/settings` oraz endpointy sesji właściciela, aby zwracały `likesCount`, `caption`, `questId` i `questsConfig` oraz umożliwiały zapis `questsConfig` przez właściciela, weryfikując zachowanie testami Vitest dla API galerii i właściciela.
- [x] 2.3 Rozszerzyć typy w `apps/web/src/lib/gallery-types.ts`, reducer `galleryReducer` w `apps/web/src/lib/live-gallery.ts` (obsługa zdarzenia `media-liked` oraz optymistycznej akcji `media-like-updated`) i hook `useLiveGallery.ts` bez resetowania wybranego elementu w `useLightboxSelection`, weryfikując pokrycie testami jednostkowymi `live-gallery.test.ts`.

## 3. Interfejs gościa i właściciela: Reakcje ❤️, Foto-Wyzwania i Podpisy (`apps/web`)

- [x] 3.1 Dodać obsługę lokalnego stanu polubień (`localStorage` `wd_likes_<slug>`), przycisk serduszka z licznikiem na kafelkach `MediaGrid.tsx` i w `LightboxModal.tsx` oraz przełącznik sortowania (*Najnowsze* / *Najpopularniejsze ❤️*) nad siatką galerii gościa, i zweryfikować komponenty testami Vitest.
- [x] 3.2 Dodać panel konfiguracji Foto-Wyzwań w panelu właściciela (`/owner/[slug]`) z gotowymi szablonami (PL/EN/DE) i dodawaniem własnych zadań, pasek filtrowania wyzwań nad galerią gościa (`/g/[slug]`), wybór wyzwania i pole podpisu `caption` (do 140 znaków) w `UploaderDrawer.tsx` oraz wyświetlanie podpisu i odznaki wyzwania w `MediaGrid.tsx` i `LightboxModal.tsx`, weryfikując nowe klucze tłumaczeń (`pl.json`, `en.json`, `de.json`) i testy komponentów Vitest.
- [x] 3.3 Zaktualizować dokumentację funkcji gościa i właściciela (reakcje na żywo, foto-wyzwania, podpisy pod zdjęciami) w `README.md` oraz `DOCUMENTATION.md` i zweryfikować spójność opisów z nowymi endpointami i schematem bazy.

## 4. Tryb TV 2.0: Podpisy, Odznaki, Serduszka i Karty Księgi Życzeń (`apps/web`)

- [x] 4.1 Rozbudować `apps/web/src/lib/tv-slideshow.ts` oraz `apps/web/src/app/[locale]/g/[slug]/tv/page.tsx`: włączyć `withWishes: true` w `useLiveGallery`, zaimplementować selektor przeplatający slajdy zdjęć kartami z Księgi Życzeń (`buildTvSlides`), dodać natychmiastowy przeskok na nowe życzenie (`new-wish`), usuwanie ukrytych życzeń (`wish-updated`) oraz wyświetlanie podpisu `caption`, odznaki wyzwania i licznika serduszek na slajdach zdjęć, weryfikując logikę testami Vitest.
- [x] 4.2 Zaktualizować opis Trybu TV w `README.md` oraz `DOCUMENTATION.md` o przeplatanie kart z Księgi Życzeń i metadane zaangażowania na ekranie.

## 5. Weryfikacja integracyjna i E2E

- [x] 5.1 Dodać testy E2E Playwright dla polubień na żywo i sortowania, przypisywania foto-wyzwania i podpisu podczas uploadu oraz wyświetlania kart życzeń w Trybie TV, a następnie uruchomić pełną weryfikację monorepo (`pnpm biome check apps/ packages/`, `pnpm turbo run check-types test` oraz `pnpm --filter @wedding-drop/web test:e2e`).

## Workflow follow-up

- Po zakończeniu implementacji i weryfikacji zarchiwizować zmianę komendą `/opsx-archive` (`pnpm openspec archive guest-engagement-pack`).
