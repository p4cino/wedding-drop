// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GallerySortToggle from "@/components/GallerySortToggle";

describe("GallerySortToggle Component", () => {
	it("renderuje przyciski sortowania z właściwym aria-pressed i wywołuje onChange", () => {
		const onChange = vi.fn();
		const { rerender } = render(
			<GallerySortToggle sortBy="newest" onChange={onChange} />,
		);

		const newestBtn = screen.getByRole("button", { name: "sortNewest" });
		const popularBtn = screen.getByRole("button", { name: "sortPopular" });

		expect(newestBtn).toHaveAttribute("aria-pressed", "true");
		expect(popularBtn).toHaveAttribute("aria-pressed", "false");

		fireEvent.click(popularBtn);
		expect(onChange).toHaveBeenCalledWith("popular");

		rerender(<GallerySortToggle sortBy="popular" onChange={onChange} />);
		expect(newestBtn).toHaveAttribute("aria-pressed", "false");
		expect(popularBtn).toHaveAttribute("aria-pressed", "true");

		fireEvent.click(newestBtn);
		expect(onChange).toHaveBeenCalledWith("newest");
	});
});
