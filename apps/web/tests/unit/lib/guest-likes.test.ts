// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import type { MediaItemData } from "@/lib/gallery-types";
import {
	getLikedMediaIds,
	setMediaLiked,
	sortGalleryItems,
} from "@/lib/guest-likes";

function makeItem(
	id: string,
	createdAt: string,
	likesCount?: number,
): MediaItemData & { likesCount?: number } {
	return {
		id,
		uploaderName: "Gość",
		fileType: "image",
		mimeType: "image/jpeg",
		originalFileName: `${id}.jpg`,
		thumbUrl: `/thumb-${id}.webp`,
		rawUrl: `/raw-${id}.jpg`,
		createdAt,
		likesCount,
	};
}

describe("guest-likes helpers", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("getLikedMediaIds zwraca pusty zbiór, gdy brak wpisu lub uszkodzony JSON", () => {
		expect(getLikedMediaIds("kasia").size).toBe(0);
		expect(getLikedMediaIds("").size).toBe(0);

		window.localStorage.setItem("wd_likes_kasia", "{not-json");
		expect(getLikedMediaIds("kasia").size).toBe(0);

		window.localStorage.setItem("wd_likes_kasia", JSON.stringify({ a: 1 }));
		expect(getLikedMediaIds("kasia").size).toBe(0);
	});

	it("setMediaLiked dodaje i usuwa identyfikatory w localStorage pod kluczem wd_likes_<slug>", () => {
		const afterLike1 = setMediaLiked("kasia", "m1", true);
		expect(afterLike1.has("m1")).toBe(true);
		expect(getLikedMediaIds("kasia").has("m1")).toBe(true);

		const afterLike2 = setMediaLiked("kasia", "m2", true);
		expect(Array.from(afterLike2)).toEqual(["m1", "m2"]);

		// Izolacja między galeriami
		expect(getLikedMediaIds("inna-galeria").size).toBe(0);

		const afterUnlike = setMediaLiked("kasia", "m1", false);
		expect(afterUnlike.has("m1")).toBe(false);
		expect(afterUnlike.has("m2")).toBe(true);
		expect(Array.from(getLikedMediaIds("kasia"))).toEqual(["m2"]);
	});

	it("sortGalleryItems zachowuje porządek dla 'newest' i sortuje malejąco po likesCount dla 'popular'", () => {
		const items = [
			makeItem("a", "2026-09-12T10:00:00.000Z", 2),
			makeItem("b", "2026-09-12T12:00:00.000Z", 10),
			makeItem("c", "2026-09-12T11:00:00.000Z", 2),
			makeItem("d", "2026-09-12T09:00:00.000Z", undefined),
		];

		const newest = sortGalleryItems(items, "newest");
		expect(newest.map((i) => i.id)).toEqual(["a", "b", "c", "d"]);
		expect(newest).not.toBe(items);

		const popular = sortGalleryItems(items, "popular");
		// 'b' (10), następnie remis 'c' i 'a' (oba po 2, 'c' nowsze niż 'a'), na końcu 'd' (0)
		expect(popular.map((i) => i.id)).toEqual(["b", "c", "a", "d"]);
	});
});
