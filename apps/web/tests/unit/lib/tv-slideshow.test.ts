import { describe, expect, it } from "vitest";
import { buildTvGalleryQrUrl } from "@/lib/tv-slideshow";

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
