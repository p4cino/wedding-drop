// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GalleryBrandingPanel } from "../../../src/components/owner/GalleryBrandingPanel";

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));

describe("GalleryBrandingPanel", () => {
	const defaultProps = {
		gallerySlug: "test-slug",
		ownerToken: "test-token",
		onBrandingUpdated: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	it("renders upload buttons when no branding paths are provided", () => {
		render(<GalleryBrandingPanel {...defaultProps} />);

		expect(screen.getByText("Wybierz plik z logo")).toBeInTheDocument();
		expect(screen.getByText("Wybierz plik z tłem")).toBeInTheDocument();
	});

	it("renders delete buttons and images when branding paths are provided", () => {
		render(
			<GalleryBrandingPanel
				{...defaultProps}
				currentLogoPath="/test/logo.png"
				currentBackgroundPath="/test/bg.png"
			/>,
		);

		expect(screen.getByText("Usuń logo")).toBeInTheDocument();
		expect(screen.getByText("Usuń tło")).toBeInTheDocument();
		expect(screen.getByAltText("Obecne logo")).toHaveAttribute(
			"src",
			expect.stringContaining("/branding-file/test-slug/logo.png"),
		);
	});

	it("handles logo deletion", async () => {
		(global.fetch as any).mockResolvedValue({ ok: true });

		render(
			<GalleryBrandingPanel
				{...defaultProps}
				currentLogoPath="/test/logo.png"
			/>,
		);

		const deleteBtn = screen.getByText("Usuń logo");

		await act(async () => {
			fireEvent.click(deleteBtn);
		});

		expect(global.fetch).toHaveBeenCalledWith(
			"/api/owner/test-slug/branding",
			expect.objectContaining({ method: "DELETE" }),
		);
	});

	it("handles background deletion", async () => {
		(global.fetch as any).mockResolvedValue({ ok: true });

		render(
			<GalleryBrandingPanel
				{...defaultProps}
				currentBackgroundPath="/test/bg.png"
			/>,
		);

		const deleteBtn = screen.getByText("Usuń tło");

		await act(async () => {
			fireEvent.click(deleteBtn);
		});

		expect(global.fetch).toHaveBeenCalledWith(
			"/api/owner/test-slug/branding",
			expect.objectContaining({ method: "DELETE" }),
		);
	});

	it("handles logo deletion error", async () => {
		(global.fetch as any).mockResolvedValue({
			ok: false,
			json: async () => ({ error: "Cannot delete" }),
		});

		render(
			<GalleryBrandingPanel
				{...defaultProps}
				currentLogoPath="/test/logo.png"
			/>,
		);

		const deleteBtn = screen.getByText("Usuń logo");

		await act(async () => {
			fireEvent.click(deleteBtn);
		});

		expect(global.fetch).toHaveBeenCalled();
	});
});
