import { describe, expect, it } from "vitest";
import { formatMegabytes } from "@/lib/format";
import {
	countByStatus,
	filterByStatus,
	type ModerationStatus,
	toggledStatus,
} from "@/lib/moderation";

describe("formatMegabytes", () => {
	it.each([
		[0, "0.0"],
		[1, "0.0"],
		[1024 * 1024, "1.0"],
		[1572864, "1.5"],
		[128.5 * 1024 * 1024, "128.5"],
		[5 * 1024 * 1024 * 1024, "5120.0"],
	])("%d B => %s", (bytes, expected) => {
		expect(formatMegabytes(bytes)).toBe(expected);
	});
});

describe("moderacja", () => {
	const items: { id: string; status: ModerationStatus }[] = [
		{ id: "a", status: "ready" },
		{ id: "b", status: "hidden" },
		{ id: "c", status: "ready" },
	];

	it("filterByStatus zwraca wszystko lub tylko dany status", () => {
		expect(filterByStatus(items, "all")).toHaveLength(3);
		expect(filterByStatus(items, "ready").map((i) => i.id)).toEqual(["a", "c"]);
		expect(filterByStatus(items, "hidden").map((i) => i.id)).toEqual(["b"]);
	});

	it("countByStatus liczy elementy o danym statusie", () => {
		expect(countByStatus(items, "ready")).toBe(2);
		expect(countByStatus(items, "hidden")).toBe(1);
		expect(countByStatus([], "ready")).toBe(0);
	});

	it("toggledStatus przełącza ready <-> hidden", () => {
		expect(toggledStatus("ready")).toBe("hidden");
		expect(toggledStatus("hidden")).toBe("ready");
	});
});
