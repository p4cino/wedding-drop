import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

if (typeof window !== "undefined") {
	// Polyfill dla ResizeObserver
	global.ResizeObserver = vi.fn().mockImplementation(() => ({
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
	}));

	// Polyfill dla URL.createObjectURL i revokeObjectURL
	window.URL.createObjectURL = vi.fn(() => "blob:mock-url");
	window.URL.revokeObjectURL = vi.fn();
}

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));
