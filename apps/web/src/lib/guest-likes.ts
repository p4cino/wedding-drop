import type { MediaItemData } from "@/lib/gallery-types";

export type GallerySortOrder = "newest" | "popular";

const STORAGE_KEY_PREFIX = "wd_likes_";

function getStorageKey(slug: string): string {
	return `${STORAGE_KEY_PREFIX}${slug}`;
}

/**
 * Bezpiecznie odczytuje zbiór identyfikatorów polubionych materiałów z `localStorage`
 * pod kluczem `wd_likes_${slug}`. Odporna na brak `window` (SSR) oraz uszkodzony JSON.
 */
export function getLikedMediaIds(slug: string): Set<string> {
	if (!slug || typeof window === "undefined") {
		return new Set();
	}
	try {
		const raw = window.localStorage.getItem(getStorageKey(slug));
		if (!raw) return new Set();
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return new Set();
		return new Set(
			parsed.filter(
				(item): item is string => typeof item === "string" && item.length > 0,
			),
		);
	} catch {
		return new Set();
	}
}

/**
 * Aktualizuje i zapisuje stan polubienia materiału `mediaId` w `localStorage`
 * pod kluczem `wd_likes_${slug}`. Zwraca nowy zbiór polubionych identyfikatorów.
 */
export function setMediaLiked(
	slug: string,
	mediaId: string,
	liked: boolean,
): Set<string> {
	const current = getLikedMediaIds(slug);
	const next = new Set(current);
	if (liked) {
		if (mediaId) next.add(mediaId);
	} else {
		next.delete(mediaId);
	}

	if (slug && typeof window !== "undefined") {
		try {
			window.localStorage.setItem(
				getStorageKey(slug),
				JSON.stringify(Array.from(next)),
			);
		} catch {
			// Ignoruj błędy quota / trybu prywatnego
		}
	}

	return next;
}

/**
 * Czysta funkcja sortująca materiały galerii:
 * - `"newest"` — zachowuje oryginalną (chronologiczną) kolejność bez mutacji tablicy wejściowej,
 * - `"popular"` — sortuje malejąco po `likesCount ?? 0`, a przy remisie malejąco po `createdAt`.
 */
export function sortGalleryItems<
	T extends Pick<MediaItemData, "id" | "createdAt"> & { likesCount?: number },
>(items: readonly T[], sortBy: GallerySortOrder): T[] {
	if (sortBy === "newest") {
		return [...items];
	}
	return [...items].sort((a, b) => {
		const likesDiff = (b.likesCount ?? 0) - (a.likesCount ?? 0);
		if (likesDiff !== 0) return likesDiff;
		return b.createdAt.localeCompare(a.createdAt);
	});
}
