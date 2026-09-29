# Design

## Context

Zmiana zbiera niskoryzykowne deduplikacje, które nie zasługują na osobne zmiany, ale razem usuwają kilkaset linii powtórzeń. Ponieważ część kodu (`GDriveBackupCard`, `UploaderDrawer`, `PhotographerImportPanel`, strony admin/owner) jest równolegle refaktoryzowana w innych zmianach, ta zmiana ma być wykonywana **ostatnia** lub rebase'owana.

## Goals / Non-Goals

**Goals:**
- Jedna implementacja każdego wzorca, zero zmian widocznych zachowań (poza pustym slugiem na stronie głównej).

**Non-Goals:**
- Wspólny system designu ani biblioteka komponentów.

## Decisions

- **`lib/moderation.ts`:** `export type ModerationStatus = "ready" | "hidden"; export type ModerationFilter = "all" | ModerationStatus; export function filterByStatus<T extends { status: ModerationStatus }>(items: T[], filter: ModerationFilter): T[]`. `ModerationFilterBar` przyjmuje `counts` i etykiety jako propsy (różne klucze i18n w `OwnerPanel` i `Wishes`).
- **Lokalny stan `filter`:** komponenty moderacji trzymają go same; propsy `filter`/`setFilter` znikają, a strona owner traci dwa stany.
- **`formatMegabytes(bytes: number): string`** w `lib/format.ts` — `(bytes / (1024 * 1024)).toFixed(1)`; test tabelaryczny (0, 1 B, 1 MB, 1.5 MB, duże wartości).
- **`sanitizeSlug`** w `packages/db/src/slug.ts` (pakiet już eksportuje walidatory slugu): `input.toLowerCase().replace(/[^a-z0-9_-]/g, "")`, ewentualnie ze wspólną stałą regexu dla `validators.ts`. Test tabelaryczny porównujący z dotychczasowym wyrażeniem dla zestawu wejść (polskie znaki, spacje, emoji, wielkie litery).
- **`StatTile`:** komponent lokalny w `OwnerStatsGrid.tsx`; prop `totalBytes: number` zamiast `totalMegabytes: string`.
- **`EmptyState`:** `components/EmptyState.tsx` (`icon`, `title`, `hint`).
- **Prywatność:** brak zmian w API; moderacja pozostaje operacją właściciela.

## Risks / Trade-offs

- [Ryzyko: subtelna zmiana sanityzacji slugu naruszy niezmiennik bezpieczeństwa] → Mitigacja: funkcja jest dosłownym przeniesieniem wyrażenia, a test tabelaryczny wymusza identyczny wynik; walidator Zod `^[a-z0-9_-]+$` nadal działa jako druga linia obrony.
- [Ryzyko: konflikty z równoległymi refaktoryzacjami] → Mitigacja: wykonać jako ostatnią z serii lub rebase'ować.
