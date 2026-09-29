import type { MediaItemData, WishItemData } from "@/lib/gallery-types";

export interface LiveGalleryState {
	items: MediaItemData[];
	wishes: WishItemData[];
}

/** Zdarzenie SSE z `/api/gallery/[slug]/live` (pola opcjonalne zależą od `type`). */
export interface LiveEvent {
	type: string;
	media?: MediaItemData;
	wish?: WishItemData;
	update?: { mediaId?: string; wishId?: string; status?: string };
}

export type LiveGalleryAction =
	| {
			type: "loaded";
			items?: MediaItemData[];
			wishes?: WishItemData[];
			maxItems?: number;
	  }
	| { type: "wish-added"; wish: WishItemData }
	| { type: "event"; event: LiveEvent; maxItems?: number };

export const initialLiveGalleryState: LiveGalleryState = {
	items: [],
	wishes: [],
};

const isRemoved = (status?: string) =>
	status === "hidden" || status === "deleted";

function prependUnique<T extends { id: string }>(list: T[], item: T): T[] {
	if (list.some((existing) => existing.id === item.id)) return list;
	return [item, ...list];
}

/**
 * Czysty reducer stanu galerii na żywo. Elementy `hidden`/`deleted` są usuwane
 * natychmiast (druga linia obrony obok filtrowania po stronie API), a duplikaty
 * tego samego `id` ignorowane.
 */
export function galleryReducer(
	state: LiveGalleryState,
	action: LiveGalleryAction,
): LiveGalleryState {
	switch (action.type) {
		case "loaded":
			return {
				items: action.items
					? action.items.slice(0, action.maxItems ?? action.items.length)
					: state.items,
				wishes: action.wishes ?? state.wishes,
			};
		case "wish-added":
			return { ...state, wishes: prependUnique(state.wishes, action.wish) };
		case "event": {
			const { event, maxItems } = action;
			if (event.type === "new-media" && event.media) {
				const items = prependUnique(state.items, event.media);
				if (items === state.items) return state;
				return { ...state, items: maxItems ? items.slice(0, maxItems) : items };
			}
			if (event.type === "media-updated" && isRemoved(event.update?.status)) {
				const items = state.items.filter(
					(item) => item.id !== event.update?.mediaId,
				);
				return items.length === state.items.length
					? state
					: { ...state, items };
			}
			if (event.type === "new-wish" && event.wish) {
				const wishes = prependUnique(state.wishes, event.wish);
				return wishes === state.wishes ? state : { ...state, wishes };
			}
			if (event.type === "wish-updated" && isRemoved(event.update?.status)) {
				const wishes = state.wishes.filter(
					(wish) => wish.id !== event.update?.wishId,
				);
				return wishes.length === state.wishes.length
					? state
					: { ...state, wishes };
			}
			return state;
		}
	}
}
