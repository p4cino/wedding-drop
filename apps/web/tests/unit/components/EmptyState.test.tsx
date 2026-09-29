// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EmptyState from "@/components/EmptyState";

describe("EmptyState", () => {
	it("renderuje ikonę, tytuł i podpowiedź oraz przyjmuje własny odstęp", () => {
		const { container } = render(
			<EmptyState
				className="py-20"
				icon={<svg data-testid="ikona" />}
				title="Brak zdjęć"
				hint="Bądź pierwszy!"
			/>,
		);
		expect(screen.getByTestId("ikona")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Brak zdjęć" }),
		).toBeInTheDocument();
		expect(screen.getByText("Bądź pierwszy!")).toBeInTheDocument();
		expect(container.firstChild).toHaveClass("py-20");
	});
});
