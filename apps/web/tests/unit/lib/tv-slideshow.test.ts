import { describe, expect, it } from "vitest";
import type { MediaItemData, WishItemData } from "@/lib/gallery-types";
import { buildTvGalleryQrUrl, buildTvSlides } from "@/lib/tv-slideshow";

function makeMedia(
	id: string,
	overrides: Partial<MediaItemData> = {},
): MediaItemData {
	return {
		id,
		uploaderName: "Gość",
		fileType: "image",
		mimeType: "image/jpeg",
		originalFileName: `${id}.jpg`,
		thumbUrl: `/media-file/thumbs/${id}.webp`,
		rawUrl: `/media-file/raw/${id}.jpg`,
		createdAt: "2026-06-01T12:00:00.000Z",
		...overrides,
	};
}

function makeWish(
	id: string,
	overrides: Partial<WishItemData> = {},
): WishItemData {
	return {
		id,
		guestName: "Ciocia Kasia",
		message: `Życzenie ${id}`,
		createdAt: "2026-06-01T12:05:00.000Z",
		...overrides,
	};
}

describe("buildTvGalleryQrUrl", () => {
	it("powinien zbudować poprawny docelowy URL galerii na podstawie sluga i origin", () => {
		expect(buildTvGalleryQrUrl("kasia-i-tomek", "https://example.com")).toBe(
			"https://example.com/g/kasia-i-tomek",
		);
	});

	it("powinien poprawnie obsłużyć slug zawierający myślniki i cyfry", () => {
		expect(buildTvGalleryQrUrl("ania-i-piotr-2026", "https://wesele.pl")).toBe(
			"https://wesele.pl/g/ania-i-piotr-2026",
		);
	});

	it("powinien zwrócić ścieżkę względną, gdy brak origin i brak obiektu window (środowisko serwerowe)", () => {
		expect(buildTvGalleryQrUrl("kasia-i-tomek")).toBe("/g/kasia-i-tomek");
	});
});

describe("buildTvSlides", () => {
	it("zwraca pustą tablicę, gdy brak zdjęć oraz życzeń", () => {
		expect(buildTvSlides([], [])).toEqual([]);
	});

	it("zwraca wyłącznie slajdy zdjęć, gdy lista życzeń jest pusta", () => {
		const items = [makeMedia("m1"), makeMedia("m2")];
		const slides = buildTvSlides(items, []);
		expect(slides).toEqual([
			{ kind: "media", id: "media-m1", media: items[0] },
			{ kind: "media", id: "media-m2", media: items[1] },
		]);
	});

	it("zwraca wyłącznie karty życzeń, gdy w galerii nie ma jeszcze zdjęć", () => {
		const wishes = [makeWish("w1"), makeWish("w2")];
		const slides = buildTvSlides([], wishes);
		expect(slides).toEqual([
			{ kind: "wish", id: "wish-w1", wish: wishes[0] },
			{ kind: "wish", id: "wish-w2", wish: wishes[1] },
		]);
	});

	it("dołącza życzenia na końcu rotacji, gdy liczba zdjęć jest mniejsza niż mediaPerWish (np. < 4)", () => {
		const items = [makeMedia("m1"), makeMedia("m2")];
		const wishes = [makeWish("w1")];
		const slides = buildTvSlides(items, wishes, 4);
		expect(slides.map((s) => s.id)).toEqual([
			"media-m1",
			"media-m2",
			"wish-w1",
		]);
	});

	it("przeplata 1 życzenie po każdych 4 zdjęciach oraz cyklicznie powtarza życzenia przy dłuższej liście zdjęć", () => {
		const items = [
			makeMedia("m1"),
			makeMedia("m2"),
			makeMedia("m3"),
			makeMedia("m4"),
			makeMedia("m5"),
			makeMedia("m6"),
			makeMedia("m7"),
			makeMedia("m8"),
			makeMedia("m9"),
		];
		const wishes = [makeWish("w1"), makeWish("w2")];
		const slides = buildTvSlides(items, wishes, 4);
		expect(slides.map((s) => s.id)).toEqual([
			"media-m1",
			"media-m2",
			"media-m3",
			"media-m4",
			"wish-w1",
			"media-m5",
			"media-m6",
			"media-m7",
			"media-m8",
			"wish-w2",
			"media-m9",
		]);
	});

	it("cyklicznie powtarza pojedyncze życzenie co mediaPerWish zdjęć", () => {
		const items = [
			makeMedia("m1"),
			makeMedia("m2"),
			makeMedia("m3"),
			makeMedia("m4"),
			makeMedia("m5"),
			makeMedia("m6"),
			makeMedia("m7"),
			makeMedia("m8"),
		];
		const wishes = [makeWish("w1")];
		const slides = buildTvSlides(items, wishes, 4);
		expect(slides.map((s) => s.id)).toEqual([
			"media-m1",
			"media-m2",
			"media-m3",
			"media-m4",
			"wish-w1",
			"media-m5",
			"media-m6",
			"media-m7",
			"media-m8",
			"wish-w1",
		]);
	});
});
