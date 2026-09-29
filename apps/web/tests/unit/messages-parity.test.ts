import { describe, expect, it } from "vitest";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import pl from "../../messages/pl.json";

function flatten(obj: Record<string, unknown>, prefix = ""): string[] {
	return Object.entries(obj).flatMap(([key, value]) => {
		const path = prefix ? `${prefix}.${key}` : key;
		return value && typeof value === "object"
			? flatten(value as Record<string, unknown>, path)
			: [path];
	});
}

const keys = {
	pl: new Set(flatten(pl)),
	en: new Set(flatten(en)),
	de: new Set(flatten(de)),
};

describe("parzystość kluczy tłumaczeń", () => {
	it.each([
		["en", "pl"],
		["de", "pl"],
		["pl", "en"],
		["pl", "de"],
	] as const)("każdy klucz z %s ma odpowiednik w %s", (from, to) => {
		const missing = [...keys[from]].filter((k) => !keys[to].has(k));
		expect(missing, `brakuje w ${to}.json`).toEqual([]);
	});

	it("wszystkie trzy języki mają niepuste teksty", () => {
		for (const [lang, set] of Object.entries({ pl, en, de })) {
			const empty = flatten(set as Record<string, unknown>).filter((path) => {
				const value = path
					.split(".")
					.reduce<unknown>(
						(acc, k) => (acc as Record<string, unknown>)[k],
						set,
					);
				return typeof value === "string" && value.trim() === "";
			});
			expect(empty, `puste teksty w ${lang}.json`).toEqual([]);
		}
	});
});
