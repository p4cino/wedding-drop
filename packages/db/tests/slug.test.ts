import { describe, expect, it } from "vitest";
import { sanitizeSlug } from "../src/slug";

// Dotychczasowe wyrażenie (strona główna i trasa admina) — wynik musi być identyczny
const legacy = (input: string) =>
	input
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, "");

const INPUTS = [
	"",
	"   ",
	"kasia-i-tomek",
	"Kasia & Tomek!",
	"  Ślub_Ani i Jana 2026  ",
	"../../etc/passwd",
	"slug\u0000null",
	"a/b\\c",
	"ŁÓDŹ",
	"emoji-💍-test",
	"UPPER_case-123",
	"tab\tnew\nline",
	"---___---",
	"%2e%2e%2f",
];

describe("sanitizeSlug", () => {
	it.each(INPUTS)(
		"daje wynik identyczny z dotychczasowym wyrażeniem dla %j",
		(input) => {
			expect(sanitizeSlug(input)).toBe(legacy(input));
		},
	);

	it("zawsze zwraca wyłącznie dozwolone znaki (^[a-z0-9_-]*$)", () => {
		for (const input of INPUTS) {
			expect(sanitizeSlug(input)).toMatch(/^[a-z0-9_-]*$/);
		}
	});

	it("usuwa sekwencje przechodzenia po katalogach", () => {
		expect(sanitizeSlug("../../etc/passwd")).toBe("etcpasswd");
		expect(sanitizeSlug("../x")).not.toContain(".");
		expect(sanitizeSlug("../x")).not.toContain("/");
	});

	it("zwraca pusty ciąg dla samych niedozwolonych znaków", () => {
		expect(sanitizeSlug("!!! ???")).toBe("");
	});
});
