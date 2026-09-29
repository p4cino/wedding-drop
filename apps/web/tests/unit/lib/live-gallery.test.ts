import { describe, expect, it } from "vitest";
import type { MediaItemData, WishItemData } from "@/lib/gallery-types";
import {
	galleryReducer,
	initialLiveGalleryState,
	type LiveGalleryState,
} from "@/lib/live-gallery";

const media = (id: string): MediaItemData => ({
	id,
	uploaderName: "Gość",
	fileType: "image",
	mimeType: "image/jpeg",
	originalFileName: `${id}.jpg`,
	thumbUrl: `/t/${id}`,
	rawUrl: `/r/${id}`,
	createdAt: "2026-09-12T12:00:00.000Z",
});

const wish = (id: string): WishItemData => ({
	id,
	guestName: null,
	message: `życzenie ${id}`,
	createdAt: "2026-09-12T12:00:00.000Z",
});

const withItems = (ids: string[]): LiveGalleryState => ({
	...initialLiveGalleryState,
	items: ids.map(media),
});

describe("galleryReducer", () => {
	it("loaded podmienia listy i respektuje maxItems", () => {
		const state = galleryReducer(initialLiveGalleryState, {
			type: "loaded",
			items: ["a", "b", "c"].map(media),
			wishes: [wish("w1")],
			maxItems: 2,
		});
		expect(state.items.map((i) => i.id)).toEqual(["a", "b"]);
		expect(state.wishes).toHaveLength(1);
	});

	it("loaded bez pola zachowuje poprzednią listę (np. nieudane pobranie życzeń)", () => {
		const prev: LiveGalleryState = { items: [media("a")], wishes: [wish("w")] };
		const state = galleryReducer(prev, { type: "loaded", items: [media("b")] });
		expect(state.items.map((i) => i.id)).toEqual(["b"]);
		expect(state.wishes).toBe(prev.wishes);
	});

	it("new-media wstawia na górę i ignoruje duplikat (ta sama referencja stanu)", () => {
		const prev = withItems(["a"]);
		const next = galleryReducer(prev, {
			type: "event",
			event: { type: "new-media", media: media("b") },
		});
		expect(next.items.map((i) => i.id)).toEqual(["b", "a"]);
		const dup = galleryReducer(next, {
			type: "event",
			event: { type: "new-media", media: media("b") },
		});
		expect(dup).toBe(next);
	});

	it("new-media przycina listę do maxItems", () => {
		const next = galleryReducer(withItems(["a", "b"]), {
			type: "event",
			event: { type: "new-media", media: media("c") },
			maxItems: 2,
		});
		expect(next.items.map((i) => i.id)).toEqual(["c", "a"]);
	});

	it.each(["hidden", "deleted"])(
		"media-updated ze statusem %s usuwa element",
		(status) => {
			const next = galleryReducer(withItems(["a", "b"]), {
				type: "event",
				event: { type: "media-updated", update: { mediaId: "a", status } },
			});
			expect(next.items.map((i) => i.id)).toEqual(["b"]);
		},
	);

	it("media-updated ze statusem ready lub nieznanym id nie zmienia stanu", () => {
		const prev = withItems(["a"]);
		expect(
			galleryReducer(prev, {
				type: "event",
				event: {
					type: "media-updated",
					update: { mediaId: "a", status: "ready" },
				},
			}),
		).toBe(prev);
		expect(
			galleryReducer(prev, {
				type: "event",
				event: {
					type: "media-updated",
					update: { mediaId: "x", status: "hidden" },
				},
			}),
		).toBe(prev);
	});

	it("new-wish wstawia na górę i ignoruje duplikaty", () => {
		const first = galleryReducer(initialLiveGalleryState, {
			type: "event",
			event: { type: "new-wish", wish: wish("w1") },
		});
		const second = galleryReducer(first, {
			type: "event",
			event: { type: "new-wish", wish: wish("w1") },
		});
		expect(second).toBe(first);
		expect(first.wishes).toHaveLength(1);
	});

	it("wish-updated usuwa ukryte i skasowane życzenie, resztę zostawia", () => {
		const prev: LiveGalleryState = {
			items: [],
			wishes: [wish("w1"), wish("w2")],
		};
		const next = galleryReducer(prev, {
			type: "event",
			event: {
				type: "wish-updated",
				update: { wishId: "w1", status: "hidden" },
			},
		});
		expect(next.wishes.map((w) => w.id)).toEqual(["w2"]);
		expect(
			galleryReducer(prev, {
				type: "event",
				event: {
					type: "wish-updated",
					update: { wishId: "nie-ma", status: "deleted" },
				},
			}),
		).toBe(prev);
	});

	it("wish-added dodaje lokalnie dodane życzenie bez duplikatu", () => {
		const first = galleryReducer(initialLiveGalleryState, {
			type: "wish-added",
			wish: wish("w1"),
		});
		expect(
			galleryReducer(first, { type: "wish-added", wish: wish("w1") }).wishes,
		).toHaveLength(1);
	});

	it("nieznane zdarzenie (np. gdrive-progress) nie zmienia stanu", () => {
		const prev = withItems(["a"]);
		expect(
			galleryReducer(prev, {
				type: "event",
				event: { type: "gdrive-progress" },
			}),
		).toBe(prev);
	});
});
