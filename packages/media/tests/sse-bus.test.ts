import { describe, expect, it, vi } from "vitest";
import { sseBus } from "../src/sse-bus.js";

describe("sse-bus event hub", () => {
	it("powinien prawidłowo emitować i odbierać zdarzenia dla danego sluga", () => {
		const slug = "test-wesele-2026";
		const callback = vi.fn();

		sseBus.on(`new-media:${slug}`, callback);

		const mockItem = {
			id: "media-123",
			uploaderName: "Świadek Jan",
			originalFileName: "zabawa.jpg",
		};

		sseBus.notifyNewMedia(slug, mockItem);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(mockItem);

		sseBus.off(`new-media:${slug}`, callback);
	});

	it("nie powinien wywoływać listenerów dla innego sluga", () => {
		const callbackA = vi.fn();
		const callbackB = vi.fn();

		sseBus.on("new-media:wesele-a", callbackA);
		sseBus.on("new-media:wesele-b", callbackB);

		sseBus.notifyNewMedia("wesele-a", { id: "item-1" });

		expect(callbackA).toHaveBeenCalledTimes(1);
		expect(callbackB).not.toHaveBeenCalled();

		sseBus.off("new-media:wesele-a", callbackA);
		sseBus.off("new-media:wesele-b", callbackB);
	});

	it("powinien emitować zdarzenie notifyMediaUpdated dla aktualizacji statusu zdjęcia", () => {
		const slug = "ania-i-tomek";
		const callback = vi.fn();

		sseBus.on(`media-updated:${slug}`, callback);

		const updatePayload = {
			mediaId: "med-888",
			status: "hidden",
		};

		sseBus.notifyMediaUpdated(slug, updatePayload);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(updatePayload);

		sseBus.off(`media-updated:${slug}`, callback);
	});

	it("powinien emitować zdarzenie notifyNewWish dla nowego życzenia", () => {
		const slug = "wesele-wishes";
		const callback = vi.fn();

		sseBus.on(`new-wish:${slug}`, callback);

		const mockWish = {
			id: "wish-1",
			guestName: "Ciocia Kasia",
			message: "Sto lat!",
		};

		sseBus.notifyNewWish(slug, mockWish);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(mockWish);

		sseBus.off(`new-wish:${slug}`, callback);
	});

	it("powinien emitować zdarzenie notifyWishUpdated dla aktualizacji statusu życzenia", () => {
		const slug = "wesele-wishes-status";
		const callback = vi.fn();

		sseBus.on(`wish-updated:${slug}`, callback);

		const updatePayload = {
			wishId: "wish-888",
			status: "hidden",
		};

		sseBus.notifyWishUpdated(slug, updatePayload);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(updatePayload);

		sseBus.off(`wish-updated:${slug}`, callback);
	});

	it("powinien być zarejestrowany w globalThis jako trwały singleton", () => {
		expect(
			(globalThis as unknown as { __wedding_sse_bus__: unknown })
				.__wedding_sse_bus__,
		).toBeDefined();
		expect(
			(globalThis as unknown as { __wedding_sse_bus__: unknown })
				.__wedding_sse_bus__,
		).toBe(sseBus);
	});
});
