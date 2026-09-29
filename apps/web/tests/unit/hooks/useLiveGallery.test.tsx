// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGalleryEvents } from "@/hooks/useGalleryEvents";
import { useLiveGallery } from "@/hooks/useLiveGallery";

class FakeEventSource {
	static instances: FakeEventSource[] = [];
	onopen: (() => void) | null = null;
	onmessage: ((e: { data: string }) => void) | null = null;
	onerror: (() => void) | null = null;
	closed = false;
	constructor(public url: string) {
		FakeEventSource.instances.push(this);
	}
	close() {
		this.closed = true;
	}
	emit(payload: unknown) {
		this.onmessage?.({
			data: typeof payload === "string" ? payload : JSON.stringify(payload),
		});
	}
}

const gallery = { id: "g1", slug: "s", coupleNames: "K & T" };
const mediaItem = (id: string) => ({
	id,
	uploaderName: "x",
	fileType: "image",
	mimeType: "image/jpeg",
	originalFileName: `${id}.jpg`,
	thumbUrl: "#",
	rawUrl: "#",
	createdAt: "2026-09-12T12:00:00.000Z",
});

function mockFetch(routes: Record<string, () => Response | Promise<Response>>) {
	return vi.fn(async (url: string) => {
		const handler = routes[url];
		if (!handler) throw new Error(`nieoczekiwane ${url}`);
		return handler();
	});
}

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status });

describe("useGalleryEvents", () => {
	beforeEach(() => {
		FakeEventSource.instances = [];
		vi.stubGlobal("EventSource", FakeEventSource);
	});
	afterEach(() => vi.unstubAllGlobals());

	it("otwiera jedno połączenie, przekazuje zdarzenia, pomija błędny JSON i zamyka przy odmontowaniu", () => {
		const onEvent = vi.fn();
		const { result, unmount } = renderHook(() =>
			useGalleryEvents("s", { onEvent }),
		);
		expect(FakeEventSource.instances).toHaveLength(1);
		const source = FakeEventSource.instances[0];
		expect(source.url).toBe("/api/gallery/s/live");

		act(() => source.onopen?.());
		expect(result.current).toBe(true);

		act(() => source.emit(": ping"));
		act(() => source.emit({ type: "new-media" }));
		expect(onEvent).toHaveBeenCalledTimes(1);

		unmount();
		expect(source.closed).toBe(true);
	});

	it("wywołuje onReconnect dopiero po ponownym otwarciu po błędzie", () => {
		const onReconnect = vi.fn();
		const { result } = renderHook(() =>
			useGalleryEvents("s", { onEvent: vi.fn(), onReconnect }),
		);
		const source = FakeEventSource.instances[0];
		act(() => source.onopen?.());
		expect(onReconnect).not.toHaveBeenCalled();

		act(() => source.onerror?.());
		expect(result.current).toBe(false);
		act(() => source.onopen?.());
		expect(onReconnect).toHaveBeenCalledTimes(1);
		expect(result.current).toBe(true);
	});

	it("nie tworzy połączenia bez sluga", () => {
		renderHook(() => useGalleryEvents(undefined, { onEvent: vi.fn() }));
		expect(FakeEventSource.instances).toHaveLength(0);
	});
});

describe("useLiveGallery", () => {
	beforeEach(() => {
		FakeEventSource.instances = [];
		vi.stubGlobal("EventSource", FakeEventSource);
	});
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it("ładuje galerię, media i życzenia oraz stosuje zdarzenia SSE", async () => {
		vi.stubGlobal(
			"fetch",
			mockFetch({
				"/api/gallery/s": () => json(gallery),
				"/api/gallery/s/media": () => json({ media: [mediaItem("a")] }),
				"/api/gallery/s/wishes": () => json({ wishes: [] }),
			}),
		);
		const { result } = renderHook(() => useLiveGallery("s"));
		expect(result.current.status).toBe("loading");
		await waitFor(() => expect(result.current.status).toBe("ready"));
		expect(result.current.items.map((i) => i.id)).toEqual(["a"]);

		act(() =>
			FakeEventSource.instances[0].emit({
				type: "new-media",
				media: mediaItem("b"),
			}),
		);
		expect(result.current.items.map((i) => i.id)).toEqual(["b", "a"]);
	});

	it("odróżnia 404 (notFound) od błędu sieci (error)", async () => {
		vi.stubGlobal(
			"fetch",
			mockFetch({ "/api/gallery/x": () => json({}, 404) }),
		);
		const notFound = renderHook(() => useLiveGallery("x"));
		await waitFor(() =>
			expect(notFound.result.current.status).toBe("notFound"),
		);

		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
		vi.spyOn(console, "error").mockImplementation(() => {});
		const failing = renderHook(() => useLiveGallery("y"));
		await waitFor(() => expect(failing.result.current.status).toBe("error"));
	});

	it("nie pobiera życzeń przy withWishes=false i respektuje maxItems", async () => {
		const fetchMock = mockFetch({
			"/api/gallery/s": () => json(gallery),
			"/api/gallery/s/media": () =>
				json({ media: [mediaItem("a"), mediaItem("b"), mediaItem("c")] }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { result } = renderHook(() =>
			useLiveGallery("s", { withWishes: false, maxItems: 2 }),
		);
		await waitFor(() => expect(result.current.status).toBe("ready"));
		expect(result.current.items).toHaveLength(2);
		expect(fetchMock).not.toHaveBeenCalledWith("/api/gallery/s/wishes");
	});

	it("po wznowieniu SSE pobiera dane ponownie i pokazuje materiały dodane w czasie rozłączenia", async () => {
		let media = [mediaItem("a")];
		vi.stubGlobal(
			"fetch",
			mockFetch({
				"/api/gallery/s": () => json(gallery),
				"/api/gallery/s/media": () => json({ media }),
				"/api/gallery/s/wishes": () => json({ wishes: [] }),
			}),
		);
		const { result } = renderHook(() => useLiveGallery("s"));
		await waitFor(() => expect(result.current.status).toBe("ready"));
		const source = FakeEventSource.instances[0];
		act(() => source.onopen?.());

		media = [mediaItem("z"), mediaItem("a")];
		act(() => source.onerror?.());
		act(() => source.onopen?.());
		await waitFor(() =>
			expect(result.current.items.map((i) => i.id)).toEqual(["z", "a"]),
		);
	});

	it("ciche odświeżenie zakończone błędem nie zamienia działającej galerii w błąd", async () => {
		let fail = false;
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: string) => {
				if (fail) throw new Error("offline");
				if (url === "/api/gallery/s") return json(gallery);
				if (url.endsWith("/media")) return json({ media: [] });
				return json({ wishes: [] });
			}),
		);
		vi.spyOn(console, "error").mockImplementation(() => {});
		const { result } = renderHook(() => useLiveGallery("s"));
		await waitFor(() => expect(result.current.status).toBe("ready"));
		fail = true;
		await act(async () => {
			await result.current.refetch();
		});
		expect(result.current.status).toBe("ready");
	});

	it("refetchWithBackoff odpala serię pobrań i czyści timery przy odmontowaniu", async () => {
		vi.useFakeTimers();
		const fetchMock = mockFetch({
			"/api/gallery/s": () => json(gallery),
			"/api/gallery/s/media": () => json({ media: [] }),
			"/api/gallery/s/wishes": () => json({ wishes: [] }),
		});
		vi.stubGlobal("fetch", fetchMock);
		const { result, unmount } = renderHook(() => useLiveGallery("s"));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		const before = fetchMock.mock.calls.length;

		act(() => result.current.refetchWithBackoff());
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1000);
		});
		expect(fetchMock.mock.calls.length).toBeGreaterThan(before);

		const afterSecond = fetchMock.mock.calls.length;
		unmount();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(10000);
		});
		expect(fetchMock.mock.calls.length).toBe(afterSecond);
	});

	it("addWish dodaje życzenie lokalnie", async () => {
		vi.stubGlobal(
			"fetch",
			mockFetch({
				"/api/gallery/s": () => json(gallery),
				"/api/gallery/s/media": () => json({ media: [] }),
				"/api/gallery/s/wishes": () => json({ wishes: [] }),
			}),
		);
		const { result } = renderHook(() => useLiveGallery("s"));
		await waitFor(() => expect(result.current.status).toBe("ready"));
		act(() =>
			result.current.addWish({
				id: "w1",
				guestName: null,
				message: "hej",
				createdAt: "2026-09-12T12:00:00.000Z",
			}),
		);
		expect(result.current.wishes).toHaveLength(1);
	});
});
