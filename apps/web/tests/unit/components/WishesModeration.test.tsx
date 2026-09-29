// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	type OwnerWishItem,
	WishesModeration,
} from "@/components/owner/WishesModeration";

const wishes: OwnerWishItem[] = [
	{
		id: "w1",
		guestName: "Ciocia Halinka",
		message: "Widoczne życzenia",
		status: "ready",
		createdAt: "2026-09-12T12:00:00.000Z",
	},
	{
		id: "w2",
		guestName: null,
		message: "Ukryte życzenia",
		status: "hidden",
		createdAt: "2026-09-12T12:05:00.000Z",
	},
];

function setup(list = wishes) {
	const onToggleStatus = vi.fn();
	const onDeleteWish = vi.fn();
	render(
		<WishesModeration
			wishesList={list}
			onToggleStatus={onToggleStatus}
			onDeleteWish={onDeleteWish}
		/>,
	);
	return { onToggleStatus, onDeleteWish };
}

describe("WishesModeration Component", () => {
	it("domyślnie pokazuje wszystkie życzenia, z oznaczeniem ukrytych i anonimowego gościa", () => {
		setup();
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
		expect(screen.getByText("Ciocia Halinka")).toBeInTheDocument();
		expect(screen.getByText("anonymousGuest")).toBeInTheDocument();
		expect(screen.getByText("hiddenOverlay")).toBeInTheDocument();
	});

	it("filtr 'widoczne' zawęża listę do życzeń o statusie ready", () => {
		setup();
		fireEvent.click(screen.getByRole("button", { name: /filterVisible/ }));
		expect(screen.getAllByRole("listitem")).toHaveLength(1);
		expect(screen.getByText("Widoczne życzenia")).toBeInTheDocument();
		expect(screen.queryByText("Ukryte życzenia")).not.toBeInTheDocument();
	});

	it("filtr 'ukryte' zawęża listę do życzeń o statusie hidden, a 'wszystkie' przywraca listę", () => {
		setup();
		fireEvent.click(screen.getByRole("button", { name: /filterHidden/ }));
		expect(screen.getAllByRole("listitem")).toHaveLength(1);
		expect(screen.getByText("Ukryte życzenia")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /filterHidden/ }),
		).toHaveAttribute("aria-pressed", "true");

		fireEvent.click(screen.getByRole("button", { name: /filterAll/ }));
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
	});

	it("pokazuje komunikat o braku życzeń, gdy lista jest pusta", () => {
		setup([]);
		expect(screen.getByText("noWishesOwner")).toBeInTheDocument();
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
	});

	it("wywołuje zmianę statusu z aktualnym statusem życzenia (ukryj / pokaż)", () => {
		const { onToggleStatus } = setup();
		fireEvent.click(screen.getByRole("button", { name: "hideAction" }));
		fireEvent.click(screen.getByRole("button", { name: "showAction" }));
		expect(onToggleStatus.mock.calls).toEqual([
			["w1", "ready"],
			["w2", "hidden"],
		]);
	});

	it("wywołuje usunięcie właściwego życzenia", () => {
		const { onDeleteWish } = setup();
		fireEvent.click(screen.getAllByRole("button", { name: "deleteAction" })[1]);
		expect(onDeleteWish).toHaveBeenCalledWith("w2");
	});
});
