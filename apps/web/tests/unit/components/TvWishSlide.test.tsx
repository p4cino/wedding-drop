// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TvWishSlide from "@/components/tv/TvWishSlide";

describe("TvWishSlide", () => {
	it("renderuje odznakę Księgi Życzeń, treść oraz autora", () => {
		render(
			<TvWishSlide
				wish={{
					id: "w1",
					guestName: "Ciocia Kasia",
					message: "Sto lat Młodej Parze!",
					createdAt: "2026-06-01T12:00:00.000Z",
				}}
			/>,
		);

		expect(screen.getByTestId("tv-wish-slide")).toBeInTheDocument();
		expect(screen.getByTestId("tv-wish-badge")).toHaveTextContent("wishBadge");
		expect(screen.getByTestId("tv-wish-message")).toHaveTextContent(
			"Sto lat Młodej Parze!",
		);
		expect(screen.getByTestId("tv-wish-author")).toHaveTextContent(
			"Ciocia Kasia",
		);
	});

	it("używa domyślnej etykiety autora, gdy guestName jest puste lub null", () => {
		render(
			<TvWishSlide
				wish={{
					id: "w2",
					guestName: "   ",
					message: "Wszystkiego najlepszego!",
					createdAt: "2026-06-01T12:00:00.000Z",
				}}
			/>,
		);

		expect(screen.getByTestId("tv-wish-author")).toHaveTextContent(
			"wishAuthorFallback",
		);
	});
});
