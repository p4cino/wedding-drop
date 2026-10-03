import { vi } from "vitest";

/** Strumień kamery z jedną ścieżką, której `stop` można sprawdzić w teście. */
export function createFakeStream() {
	const track = { stop: vi.fn() };
	const stream = { getTracks: () => [track] } as unknown as MediaStream;
	return { stream, track };
}

/**
 * Podstawia `navigator.mediaDevices.getUserMedia` oraz `enumerateDevices` (jsdom ich nie ma).
 * Zwraca mock `getUserMedia`, żeby test mógł sprawdzić wywołania, z dołączonym `enumerateDevices`.
 */
export function stubMediaDevices(
	getUserMedia: (
		constraints?: MediaStreamConstraints,
	) => Promise<MediaStream> = () => Promise.resolve(createFakeStream().stream),
	devices: MediaDeviceInfo[] | (() => Promise<MediaDeviceInfo[]>) = [
		{
			deviceId: "cam-environment",
			kind: "videoinput",
			label: "Back Camera",
			groupId: "g1",
			toJSON: () => ({}),
		} as MediaDeviceInfo,
		{
			deviceId: "cam-user",
			kind: "videoinput",
			label: "Front Camera",
			groupId: "g2",
			toJSON: () => ({}),
		} as MediaDeviceInfo,
	],
) {
	const fn = vi.fn(getUserMedia);
	const enumFn = vi.fn(
		typeof devices === "function" ? devices : () => Promise.resolve(devices),
	);
	Object.defineProperty(navigator, "mediaDevices", {
		configurable: true,
		value: {
			getUserMedia: fn,
			enumerateDevices: enumFn,
		},
	});
	return Object.assign(fn, { enumerateDevices: enumFn });
}

/** Symuluje przeglądarkę bez API `mediaDevices` (np. brak bezpiecznego kontekstu). */
export function removeMediaDevices() {
	Object.defineProperty(navigator, "mediaDevices", {
		configurable: true,
		value: undefined,
	});
}
