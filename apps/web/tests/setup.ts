import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

if (typeof window !== "undefined") {
	// Polyfill dla ResizeObserver
	global.ResizeObserver = vi.fn().mockImplementation(() => ({
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
	}));

	// jsdom nie implementuje odtwarzania mediów — kod produkcyjny woła `video.play()`
	window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);

	// Polyfill dla URL.createObjectURL i revokeObjectURL
	window.URL.createObjectURL = vi.fn(() => "blob:mock-url");
	window.URL.revokeObjectURL = vi.fn();

	// jsdom nie implementuje EventSource (SSE)
	if (typeof window.EventSource === "undefined") {
		class DefaultFakeEventSource {
			onopen: (() => void) | null = null;
			onmessage: ((e: { data: string }) => void) | null = null;
			onerror: (() => void) | null = null;
			close() {}
		}
		// @ts-expect-error stub EventSource w jsdom
		window.EventSource = DefaultFakeEventSource;
		// @ts-expect-error stub EventSource w jsdom
		global.EventSource = DefaultFakeEventSource;
	}
}

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));
