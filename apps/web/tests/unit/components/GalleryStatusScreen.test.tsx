// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GalleryStatusScreen from "@/components/GalleryStatusScreen";

vi.mock("@/i18n/routing", () => ({
	Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
}));

describe("GalleryStatusScreen", () => {
	it("pokazuje stan ładowania", () => {
		render(<GalleryStatusScreen variant="loading" />);
		expect(screen.getByText("loading")).toBeInTheDocument();
	});

	it("pokazuje brak galerii z linkiem do strony głównej", () => {
		render(<GalleryStatusScreen variant="notFound" />);
		expect(screen.getByText("notFoundTitle")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "homeBtn" })).toHaveAttribute(
			"href",
			"/",
		);
	});

	it("pokazuje błąd sieci z przyciskiem ponowienia (nie ekran 'nie znaleziono')", () => {
		const onRetry = vi.fn();
		render(<GalleryStatusScreen variant="error" dark onRetry={onRetry} />);
		expect(screen.getByText("loadError")).toBeInTheDocument();
		expect(screen.queryByText("notFoundTitle")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "retryBtn" }));
		expect(onRetry).toHaveBeenCalledTimes(1);
	});
});
