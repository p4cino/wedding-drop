// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WishesBook, { type WishItemData } from "@/components/WishesBook";

function makeWish(id: string, guestName: string | null): WishItemData {
	return {
		id,
		guestName,
		message: `Życzenia ${id}`,
		createdAt: "2026-09-12T12:00:00.000Z",
	};
}

describe("WishesBook Component", () => {
	it("pokazuje pusty stan, gdy nie ma żadnych życzeń", () => {
		render(<WishesBook wishes={[]} onSubmit={vi.fn()} />);
		expect(screen.getByText("noWishes")).toBeInTheDocument();
		expect(screen.getByText("beFirstWish")).toBeInTheDocument();
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
	});

	it("renderuje listę życzeń, a dla braku podpisu używa etykiety anonimowego gościa", () => {
		render(
			<WishesBook
				wishes={[
					makeWish("1", "Ciocia Halinka"),
					makeWish("2", "   "),
					makeWish("3", null),
				]}
				onSubmit={vi.fn()}
			/>,
		);
		expect(screen.getAllByRole("listitem")).toHaveLength(3);
		expect(screen.getByText("Ciocia Halinka")).toBeInTheDocument();
		expect(screen.getAllByText("anonymousGuest")).toHaveLength(2);
	});

	it("blokuje przycisk wysyłki, dopóki treść życzeń jest pusta", () => {
		render(<WishesBook wishes={[]} onSubmit={vi.fn()} />);
		expect(screen.getByRole("button", { name: /submitBtn/ })).toBeDisabled();
	});

	it("pokazuje błąd walidacji i nie wywołuje onSubmit dla samych białych znaków", () => {
		const onSubmit = vi.fn();
		render(<WishesBook wishes={[]} onSubmit={onSubmit} />);
		fireEvent.change(screen.getByLabelText("messageLabel"), {
			target: { value: "   " },
		});
		const form = screen.getByLabelText("messageLabel").closest("form");
		expect(form).not.toBeNull();
		fireEvent.submit(form as HTMLFormElement);
		expect(screen.getByRole("alert")).toHaveTextContent("messageRequired");
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("wysyła przycięte dane i czyści formularz po sukcesie", async () => {
		const onSubmit = vi.fn().mockResolvedValue(true);
		render(<WishesBook wishes={[]} onSubmit={onSubmit} />);
		fireEvent.change(screen.getByLabelText("nameLabel"), {
			target: { value: " Wujek Staszek " },
		});
		fireEvent.change(screen.getByLabelText("messageLabel"), {
			target: { value: " Wszystkiego dobrego! " },
		});
		fireEvent.click(screen.getByRole("button", { name: /submitBtn/ }));

		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith(
				"Wujek Staszek",
				"Wszystkiego dobrego!",
			),
		);
		await waitFor(() =>
			expect(screen.getByLabelText("messageLabel")).toHaveValue(""),
		);
		expect(screen.getByLabelText("nameLabel")).toHaveValue("");
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("pokazuje błąd i zachowuje wpisaną treść, gdy wysyłka się nie powiedzie", async () => {
		const onSubmit = vi.fn().mockResolvedValue(false);
		render(<WishesBook wishes={[]} onSubmit={onSubmit} />);
		fireEvent.change(screen.getByLabelText("messageLabel"), {
			target: { value: "Szczęścia!" },
		});
		fireEvent.click(screen.getByRole("button", { name: /submitBtn/ }));

		expect(await screen.findByRole("alert")).toHaveTextContent("submitError");
		expect(screen.getByLabelText("messageLabel")).toHaveValue("Szczęścia!");
	});

	it("pokazuje stan wysyłania i blokuje przycisk w trakcie wysyłki", async () => {
		let resolveSubmit: (value: boolean) => void = () => {};
		const onSubmit = vi.fn(
			() =>
				new Promise<boolean>((resolve) => {
					resolveSubmit = resolve;
				}),
		);
		render(<WishesBook wishes={[]} onSubmit={onSubmit} />);
		fireEvent.change(screen.getByLabelText("messageLabel"), {
			target: { value: "Hej" },
		});
		fireEvent.click(screen.getByRole("button", { name: /submitBtn/ }));

		const sending = await screen.findByRole("button", { name: /sending/ });
		expect(sending).toBeDisabled();

		resolveSubmit(true);
		await waitFor(() =>
			expect(screen.getByRole("button", { name: /submitBtn/ })).toBeDisabled(),
		);
	});
});
