import { describe, it, expect, vi } from "vitest";
import { sseBus } from "@/lib/sse-bus";

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

  it("powinien być zarejestrowany w globalThis jako trwały singleton", () => {
    expect((globalThis as any).__wedding_sse_bus__).toBeDefined();
    expect((globalThis as any).__wedding_sse_bus__).toBe(sseBus);
  });
});
