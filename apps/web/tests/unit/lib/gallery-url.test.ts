import { describe, expect, it } from "vitest";
import { DEFAULT_CARD_COLORS } from "@/lib/card-defaults";
import { buildGalleryUrl } from "@/lib/gallery-url";
import { buildTvGalleryQrUrl } from "@/lib/tv-slideshow";

describe("buildGalleryUrl", () => {
	it("łączy origin i slug", () => {
		expect(buildGalleryUrl("kasia-i-tomek", "https://wesele.pl")).toBe(
			"https://wesele.pl/g/kasia-i-tomek",
		);
	});

	it("bez origin w środowisku bez window zwraca ścieżkę względną", () => {
		expect(buildGalleryUrl("s", "")).toBe("/g/s");
	});

	it("buildTvGalleryQrUrl to ta sama funkcja (jedno źródło adresu QR)", () => {
		expect(buildTvGalleryQrUrl).toBe(buildGalleryUrl);
	});
});

describe("DEFAULT_CARD_COLORS", () => {
	it("to domyślny motyw Złoto & Granat", () => {
		expect(DEFAULT_CARD_COLORS).toEqual({
			primary: "#1E293B",
			accent: "#D4AF37",
		});
	});
});
