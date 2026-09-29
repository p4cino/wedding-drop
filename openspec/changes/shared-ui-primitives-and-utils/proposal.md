# Proposal

## Why

Kilka drobnych wzorców jest skopiowanych po kilka razy w komponentach klienta, co utrudnia zmiany i sprzyja rozjazdom:

- **Moderacja:** `MediaGridWithModeration.tsx` (linie ok. 32-90, 138-170) i `WishesModeration.tsx` (ok. 31-88, 117-151) mają identyczne: typ `"all" | "ready" | "hidden"` (w czterech miejscach, w tym `owner/[slug]/page.tsx`), trzy przyciski filtra z tym samym `className` oraz przyciski Eye/EyeOff + Trash2. `onToggleStatus(id, currentStatus: string)` wymusza rzutowanie `as "ready" | "hidden"` w stronie.
- **Formatowanie megabajtów** `(x / (1024 * 1024)).toFixed(1)` w 6 miejscach: `owner/[slug]/page.tsx:533`, `admin/page.tsx:271,386`, `UploaderDrawer.tsx:372`, `PhotographerImportPanel.tsx:234`, `GDriveBackupCard.tsx:62,65`.
- **Kafelki statystyk:** `OwnerStatsGrid.tsx` ma trzy kafelki ze skopiowanym markupem, a prop `totalMegabytes: string` przekazuje już sformatowany tekst zamiast liczby.
- **Pusty stan:** prawie identyczny w `MediaGrid.tsx` (ok. 15-27) i `WishesBook.tsx` (ok. 128-138).
- **Sanityzacja slugu:** `ten sam regex `replace(/[^a-z0-9_-]/g, "")` jest w `[locale]/page.tsx:29` i `api/admin/galleries/route.ts:105`; po sanityzacji slug w stronie głównej może być pusty (`router.push("/g/")`). Slug to niezmiennik bezpieczeństwa (AGENTS.md), więc powinien mieć jedną definicję.

## What Changes

- `ModerationFilterBar`, `ModerationActions` i typ `ModerationStatus` (`lib/moderation.ts` z `filterByStatus`) — stan `filter` jest trzymany lokalnie w komponentach moderacji (rodzic go nie używa); `onToggleStatus(item)` zamiast `(id, string)`.
- `lib/format.ts`: `formatMegabytes(bytes)` użyte we wszystkich 6 miejscach.
- `StatTile` w `OwnerStatsGrid`, prop liczbowy zamiast sformatowanego tekstu.
- `EmptyState` (`icon`, `title`, `hint`) dla `MediaGrid` i `WishesBook`.
- `sanitizeSlug(input)` w `packages/db/src/slug.ts` (eksport z `@wedding-drop/db`), używane w stronie głównej i trasie admina; strona główna nie nawiguje przy pustym wyniku.

## Capabilities

### New Capabilities

- `shared-ui-primitives`: wspólne, przetestowane prymitywy UI i narzędzia (filtr moderacji, formatowanie rozmiaru, stan pusty, sanityzacja slugu) zamiast lokalnych kopii.

### Modified Capabilities

(brak — wyjątek: strona główna nie przechodzi do `/g/` przy pustym slugu)

## Impact

- `apps/web/src/components/**`, `owner/[slug]/page.tsx`, `admin/page.tsx`, `[locale]/page.tsx`, `packages/db/src/slug.ts` + eksport, trasa `api/admin/galleries/route.ts`, testy.
- Sanityzacja slugu jest niezmiennikiem bezpieczeństwa (`^[a-z0-9_-]+$` przed użyciem w FS/SQL): zmiana **nie może** zmienić wyniku dla żadnego wejścia — potwierdzone testem tabelarycznym.
- N100: bez wpływu.

## Non-goals / Poza zakresem

- Brak wspólnego `PrimaryButton`/systemu designu (osobna, niższego priorytetu decyzja).
- Brak zmian w logice moderacji po stronie API.
- Brak zmian walidatorów Zod slugu w `validators.ts` poza ewentualnym użyciem tej samej stałej regexu.
