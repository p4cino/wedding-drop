import { vi } from "vitest";

/** Strumień kamery z jedną ścieżką, której `stop` można sprawdzić w teście. */
export function createFakeStream() {
	const track = { stop: vi.fn() };
	const stream = { getTracks: () => [track] } as unknown as MediaStream;
	return { stream, track };
}

/**
 * Podstawia `navigator.mediaDevices.getUserMedia` (jsdom go nie ma).
 * Zwraca mock `getUserMedia`, żeby test mógł sprawdzić wywołania.
 */
export function stubMediaDevices(
	getUserMedia: () => Promise<MediaStream> = () =>
		Promise.resolve(createFakeStream().stream),
) {
	const fn = vi.fn(getUserMedia);
	Object.defineProperty(navigator, "mediaDevices", {
		configurable: true,
		value: { getUserMedia: fn },
	});
	return fn;
}

/** Symuluje przeglądarkę bez API `mediaDevices` (np. brak bezpiecznego kontekstu). */
export function removeMediaDevices() {
	Object.defineProperty(navigator, "mediaDevices", {
		configurable: true,
		value: undefined,
	});
}
