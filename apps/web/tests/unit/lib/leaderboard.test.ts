import { describe, expect, it } from "vitest";
import type { MediaItemData } from "@/components/LightboxModal";
import { computeLeaderboard } from "@/lib/leaderboard";

function makeItem(overrides: Partial<MediaItemData>): MediaItemData {
	return {
		id: overrides.id ?? Math.random().toString(36).slice(2),
		uploaderName: overrides.uploaderName ?? "",
		fileType: overrides.fileType ?? "image",
		mimeType: overrides.mimeType ?? "image/jpeg",
		originalFileName: overrides.originalFileName ?? "zdjecie.jpg",
		thumbUrl: overrides.thumbUrl ?? "/thumb.webp",
		rawUrl: overrides.rawUrl ?? "/raw.jpg",
		createdAt: overrides.createdAt ?? "2026-09-12T12:00:00.000Z",
	};
}

describe("computeLeaderboard", () => {
	it("zwraca dokładnie trzy pozycje uszeregowane malejąco, gdy jest co najmniej trzech gości", () => {
		const items = [
			...Array.from({ length: 5 }, () =>
				makeItem({ uploaderName: "Wujek Staszek" }),
			),
			...Array.from({ length: 3 }, () =>
				makeItem({ uploaderName: "Ciocia Halinka" }),
			),
			...Array.from({ length: 1 }, () =>
				makeItem({ uploaderName: "Kuzyn Tomek" }),
			),
		];

		const result = computeLeaderboard(items);

		expect(result).toEqual([
			{ name: "Wujek Staszek", count: 5 },
			{ name: "Ciocia Halinka", count: 3 },
			{ name: "Kuzyn Tomek", count: 1 },
		]);
	});

	it("nie dopełnia listy sztucznie, gdy jest mniej niż trzech gości", () => {
		const items = [
			makeItem({ uploaderName: "Świadek Jan" }),
			makeItem({ uploaderName: "Świadek Jan" }),
		];

		const result = computeLeaderboard(items);

		expect(result).toEqual([{ name: "Świadek Jan", count: 2 }]);
	});

	it("zwraca pustą listę, gdy nie ma żadnych materiałów", () => {
		expect(computeLeaderboard([])).toEqual([]);
	});

	it("grupuje różne zapisy tego samego podpisu (wielkość liter, białe znaki) razem", () => {
		const items = [
			makeItem({ uploaderName: "Wujek Janusz" }),
			makeItem({ uploaderName: "wujek janusz " }),
			makeItem({ uploaderName: " WUJEK JANUSZ" }),
		];

		const result = computeLeaderboard(items);

		expect(result).toEqual([{ name: "Wujek Janusz", count: 3 }]);
	});

	it("przy remisie w liczbie materiałów zachowuje stabilną (kolejność napotkania) kolejność", () => {
		const items = [
			makeItem({ uploaderName: "Gość A" }),
			makeItem({ uploaderName: "Gość B" }),
		];

		const result = computeLeaderboard(items);

		expect(result).toEqual([
			{ name: "Gość A", count: 1 },
			{ name: "Gość B", count: 1 },
		]);
	});

	it("pomija materiały z pustym lub samym białymi znakami podpisem gościa", () => {
		const items = [
			makeItem({ uploaderName: "" }),
			makeItem({ uploaderName: "   " }),
			makeItem({ uploaderName: "Ciocia Ania" }),
		];

		const result = computeLeaderboard(items);

		expect(result).toEqual([{ name: "Ciocia Ania", count: 1 }]);
	});

	it("ogranicza wynik do TOP 3, nawet gdy jest więcej unikalnych gości", () => {
		const items = [
			makeItem({ uploaderName: "A" }),
			makeItem({ uploaderName: "A" }),
			makeItem({ uploaderName: "A" }),
			makeItem({ uploaderName: "B" }),
			makeItem({ uploaderName: "B" }),
			makeItem({ uploaderName: "C" }),
			makeItem({ uploaderName: "D" }),
		];

		const result = computeLeaderboard(items);

		expect(result).toHaveLength(3);
		expect(result.map((e) => e.name)).toEqual(["A", "B", "C"]);
	});

	it("liczy wyłącznie materiały przekazane w tablicy `items` — suma wyników nigdy nie przekracza jej długości", () => {
		const firstBatch = [
			makeItem({ uploaderName: "Gość X" }),
			makeItem({ uploaderName: "Gość Y" }),
		];
		const secondBatch = [
			makeItem({ uploaderName: "Gość X" }),
			makeItem({ uploaderName: "Gość X" }),
			makeItem({ uploaderName: "Gość Z" }),
		];

		const firstResult = computeLeaderboard(firstBatch);
		const totalFirst = firstResult.reduce((sum, e) => sum + e.count, 0);
		expect(totalFirst).toBe(firstBatch.length);

		// Wywołanie z inną tablicą nie może "przeciekać" wyników z poprzedniego wywołania —
		// filtrowanie widoczności (status ready/hidden/deleted) pozostaje po stronie
		// wywołującego; funkcja liczy tylko to, co dostała w argumencie.
		const secondResult = computeLeaderboard(secondBatch);
		const totalSecond = secondResult.reduce((sum, e) => sum + e.count, 0);
		expect(totalSecond).toBe(secondBatch.length);
		expect(secondResult.find((e) => e.name === "Gość Y")).toBeUndefined();
		expect(secondResult.find((e) => e.name === "Gość X")?.count).toBe(2);
	});
});
