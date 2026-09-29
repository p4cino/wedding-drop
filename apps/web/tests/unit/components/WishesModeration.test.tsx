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

function setup(filter: "all" | "ready" | "hidden" = "all", list = wishes) {
	const setFilter = vi.fn();
	const onToggleStatus = vi.fn();
	const onDeleteWish = vi.fn();
	render(
		<WishesModeration
			wishesList={list}
			filter={filter}
			setFilter={setFilter}
			onToggleStatus={onToggleStatus}
			onDeleteWish={onDeleteWish}
		/>,
	);
	return { setFilter, onToggleStatus, onDeleteWish };
}

describe("WishesModeration Component", () => {
	it("pokazuje wszystkie życzenia przy filtrze 'all', z oznaczeniem ukrytych i anonimowego gościa", () => {
		setup("all");
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
		expect(screen.getByText("Ciocia Halinka")).toBeInTheDocument();
		expect(screen.getByText("anonymousGuest")).toBeInTheDocument();
		expect(screen.getByText("hiddenOverlay")).toBeInTheDocument();
	});

	it("filtruje do widocznych życzeń przy filtrze 'ready'", () => {
		setup("ready");
		expect(screen.getAllByRole("listitem")).toHaveLength(1);
		expect(screen.getByText("Widoczne życzenia")).toBeInTheDocument();
		expect(screen.queryByText("Ukryte życzenia")).not.toBeInTheDocument();
	});

	it("filtruje do ukrytych życzeń przy filtrze 'hidden'", () => {
		setup("hidden");
		expect(screen.getAllByRole("listitem")).toHaveLength(1);
		expect(screen.getByText("Ukryte życzenia")).toBeInTheDocument();
	});

	it("pokazuje komunikat o braku życzeń, gdy lista po filtrowaniu jest pusta", () => {
		setup("all", []);
		expect(screen.getByText("noWishesOwner")).toBeInTheDocument();
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
	});

	it("przełącza filtry i oznacza aktywny przez aria-pressed", () => {
		const { setFilter } = setup("ready");
		const buttons = screen.getAllByRole("button", { pressed: true });
		expect(buttons).toHaveLength(1);

		fireEvent.click(screen.getByRole("button", { name: /filterAll/ }));
		fireEvent.click(screen.getByRole("button", { name: /filterVisible/ }));
		fireEvent.click(screen.getByRole("button", { name: /filterHidden/ }));
		expect(setFilter.mock.calls).toEqual([["all"], ["ready"], ["hidden"]]);
	});

	it("wywołuje zmianę statusu z aktualnym statusem życzenia (ukryj / pokaż)", () => {
		const { onToggleStatus } = setup("all");
		fireEvent.click(screen.getByRole("button", { name: "hideAction" }));
		fireEvent.click(screen.getByRole("button", { name: "showAction" }));
		expect(onToggleStatus.mock.calls).toEqual([
			["w1", "ready"],
			["w2", "hidden"],
		]);
	});

	it("wywołuje usunięcie właściwego życzenia", () => {
		const { onDeleteWish } = setup("all");
		fireEvent.click(screen.getAllByRole("button", { name: "deleteAction" })[1]);
		expect(onDeleteWish).toHaveBeenCalledWith("w2");
	});
});
