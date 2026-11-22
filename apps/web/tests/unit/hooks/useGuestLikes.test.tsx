// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGuestLikes } from "@/hooks/useGuestLikes";
import type { MediaItemData } from "@/lib/gallery-types";

function makeMedia(id: string, likesCount = 0): MediaItemData {
	return {
		id,
		uploaderName: "Gość",
		fileType: "image",
		mimeType: "image/jpeg",
		originalFileName: `${id}.jpg`,
		thumbUrl: `/t-${id}.webp`,
		rawUrl: `/r-${id}.jpg`,
		createdAt: "2026-09-12T12:00:00.000Z",
		likesCount,
	};
}

describe("useGuestLikes hook", () => {
	beforeEach(() => {
		window.localStorage.clear();
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("inicjalizuje likedIds z localStorage i synchronizuje serwerowe likesCount przy sukcesie", async () => {
		window.localStorage.setItem("wd_likes_kasia", JSON.stringify(["m2"]));
		const updateMediaLikes = vi.fn();
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ id: "m1", likesCount: 5 }), {
				status: 200,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const { result } = renderHook(() =>
			useGuestLikes({
				slug: "kasia",
				items: [makeMedia("m1", 3), makeMedia("m2", 1)],
				updateMediaLikes,
			}),
		);

		expect(result.current.likedIds.has("m2")).toBe(true);
		expect(result.current.likedIds.has("m1")).toBe(false);

		await act(async () => {
			await result.current.toggleLike("m1");
		});

		// Optymistycznie 4, potem z odpowiedzi serwera 5
		expect(updateMediaLikes).toHaveBeenNthCalledWith(1, "m1", 4);
		expect(updateMediaLikes).toHaveBeenNthCalledWith(2, "m1", 5);
		expect(result.current.likedIds.has("m1")).toBe(true);
		expect(
			JSON.parse(window.localStorage.getItem("wd_likes_kasia") ?? "[]"),
		).toContain("m1");
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/gallery/kasia/media/m1/like",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ action: "like" }),
			}),
		);
	});

	it.each([429, 500, 403])(
		"cofa optymistyczną zmianę w stanie, callbacku i localStorage gdy serwer zwróci HTTP %i",
		async (status) => {
			const updateMediaLikes = vi.fn();
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue(new Response("err", { status })),
			);

			const { result } = renderHook(() =>
				useGuestLikes({
					slug: "kasia",
					items: [makeMedia("m1", 2)],
					updateMediaLikes,
				}),
			);

			await act(async () => {
				await result.current.toggleLike("m1");
			});

			// Najpierw optymistycznie +1 (3), następnie rollback do 2
			expect(updateMediaLikes).toHaveBeenNthCalledWith(1, "m1", 3);
			expect(updateMediaLikes).toHaveBeenNthCalledWith(2, "m1", 2);
			expect(result.current.likedIds.has("m1")).toBe(false);
			expect(
				JSON.parse(window.localStorage.getItem("wd_likes_kasia") ?? "[]"),
			).toEqual([]);
		},
	);

	it("cofa optymistyczne cofnięcie polubienia przy błędzie sieciowym (fetch reject)", async () => {
		window.localStorage.setItem("wd_likes_kasia", JSON.stringify(["m1"]));
		const updateMediaLikes = vi.fn();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockRejectedValue(new Error("Network failure")),
		);

		const { result } = renderHook(() =>
			useGuestLikes({
				slug: "kasia",
				items: [makeMedia("m1", 4)],
				updateMediaLikes,
			}),
		);

		await act(async () => {
			await result.current.toggleLike("m1");
		});

		// Najpierw optymistycznie -1 (3), następnie rollback do 4 i przywrócenie polubienia
		expect(updateMediaLikes).toHaveBeenNthCalledWith(1, "m1", 3);
		expect(updateMediaLikes).toHaveBeenNthCalledWith(2, "m1", 4);
		expect(result.current.likedIds.has("m1")).toBe(true);
		expect(
			JSON.parse(window.localStorage.getItem("wd_likes_kasia") ?? "[]"),
		).toEqual(["m1"]);
	});

	it("utrzymuje stabilną referencję toggleLike mimo zmian items i likedIds", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ id: "m1", likesCount: 1 }), {
					status: 200,
				}),
			),
		);

		const { result, rerender } = renderHook(
			({ items }) => useGuestLikes({ slug: "kasia", items }),
			{ initialProps: { items: [makeMedia("m1", 0)] } },
		);

		const firstRef = result.current.toggleLike;

		await act(async () => {
			await result.current.toggleLike("m1");
		});

		rerender({ items: [makeMedia("m1", 1), makeMedia("m2", 0)] });
		expect(result.current.toggleLike).toBe(firstRef);
	});
});
