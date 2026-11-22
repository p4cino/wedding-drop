/**
 * Czyste, testowalne bez DOM funkcje pomocnicze dla widoku trybu TV (`/g/{slug}/tv`).
 */

import type { MediaItemData, WishItemData } from "@/lib/gallery-types";
import { buildGalleryUrl } from "@/lib/gallery-url";

/**
 * Adres galerii gościa kodowany w QR w rogu ekranu w trybie TV
 * (ta sama funkcja co dla karteczki stołowej).
 */
export const buildTvGalleryQrUrl = buildGalleryUrl;

/**
 * Pojedynczy slajd w rotacji Trybu TV 2.0 — zdjęcie/wideo/audio lub karta z Księgi Życzeń.
 */
export type TvSlide =
	| { kind: "media"; id: string; media: MediaItemData }
	| { kind: "wish"; id: string; wish: WishItemData };

/**
 * Buduje sekwencję slajdów Trybu TV przeplatającą materiały multimedialne
 * kartami z Księgi Życzeń (1 życzenie po każdych `mediaPerWish` zdjęciach,
 * z gwarancją obecności życzeń również w małych galeriach < `mediaPerWish` zdjęć).
 */
export function buildTvSlides(
	items: MediaItemData[],
	wishes: WishItemData[],
	mediaPerWish = 4,
): TvSlide[] {
	if (items.length === 0 && wishes.length === 0) {
		return [];
	}

	if (items.length === 0) {
		return wishes.map((wish) => ({
			kind: "wish",
			id: `wish-${wish.id}`,
			wish,
		}));
	}

	if (wishes.length === 0) {
		return items.map((media) => ({
			kind: "media",
			id: `media-${media.id}`,
			media,
		}));
	}

	const step = Math.max(1, Math.floor(mediaPerWish));
	const slides: TvSlide[] = [];
	let wishIndex = 0;

	for (let i = 0; i < items.length; i++) {
		const media = items[i];
		if (!media) continue;
		slides.push({
			kind: "media",
			id: `media-${media.id}`,
			media,
		});

		if ((i + 1) % step === 0) {
			const wish = wishes[wishIndex % wishes.length];
			if (wish) {
				slides.push({
					kind: "wish",
					id: `wish-${wish.id}`,
					wish,
				});
				wishIndex++;
			}
		}
	}

	// Jeśli liczba zdjęć była mniejsza niż `step` (lub zostało więcej unikalnych życzeń
	// niż pełnych bloków zdjęć), dopisujemy pozostałe życzenia na końcu rotacji,
	// aby każde widoczne życzenie pojawiło się w cyklu.
	while (wishIndex < wishes.length) {
		const wish = wishes[wishIndex];
		if (wish) {
			slides.push({
				kind: "wish",
				id: `wish-${wish.id}`,
				wish,
			});
		}
		wishIndex++;
	}

	return slides;
}

/**
 * Zwraca tytuł foto-wyzwania dla danego `questId`, jeśli wyzwania są aktywne w galerii.
 */
export function resolveTvQuestTitle(
	questsConfig:
		| { enabled?: boolean; items?: Array<{ id: string; title: string }> }
		| null
		| undefined,
	questId?: string | null,
): string | null {
	if (
		!questId ||
		!questsConfig?.enabled ||
		!Array.isArray(questsConfig.items)
	) {
		return null;
	}
	const found = questsConfig.items.find((item) => item.id === questId);
	const title = found?.title?.trim();
	return title ? title : null;
}
