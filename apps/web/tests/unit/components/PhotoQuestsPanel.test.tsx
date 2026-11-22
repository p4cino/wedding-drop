// @vitest-environment jsdom

import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PhotoQuestsPanel } from "@/components/owner/PhotoQuestsPanel";

describe("PhotoQuestsPanel Component", () => {
	it("pozwala włączyć wyzwania, dodać pozycję z szablonu oraz własne zadanie, usunąć i zapisać", async () => {
		const onSave = vi.fn().mockResolvedValue(true);

		render(
			<PhotoQuestsPanel
				questsConfig={{ enabled: false, items: [] }}
				onSave={onSave}
			/>,
		);

		expect(screen.getByText("questsPanelTitle")).toBeInTheDocument();

		// Włączenie checkboxa
		const toggle = screen.getByRole("checkbox");
		expect(toggle).not.toBeChecked();
		fireEvent.click(toggle);
		expect(toggle).toBeChecked();

		// Dodanie wyzwania z szablonu
		fireEvent.click(screen.getByRole("button", { name: "questTplFirstDance" }));
		expect(screen.getByText("Pierwszy taniec")).toBeInTheDocument();

		// Walidacja za krótkiego własnego wyzwania (< 2 znaki)
		const input = screen.getByLabelText("questsCustomLabel");
		fireEvent.change(input, { target: { value: "A" } });
		fireEvent.click(screen.getByRole("button", { name: "questsAddBtn" }));
		expect(screen.getByRole("alert")).toHaveTextContent(
			"questsValidationLength",
		);

		// Dodanie poprawnego własnego wyzwania
		fireEvent.change(input, {
			target: { value: "Zdjęcie z tortem weselnym" },
		});
		fireEvent.click(screen.getByRole("button", { name: "questsAddBtn" }));
		expect(screen.getByText("Zdjęcie z tortem weselnym")).toBeInTheDocument();

		// Usunięcie pierwszego wyzwania
		const removeButtons = screen.getAllByRole("button", {
			name: "questsRemoveAria",
		});
		expect(removeButtons).toHaveLength(2);
		fireEvent.click(removeButtons[0]);

		// Zapisanie konfiguracji
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "questsSaveBtn" }));
		});

		expect(onSave).toHaveBeenCalledWith({
			enabled: true,
			items: [
				{
					id: "zdjecie-z-tortem-weselnym",
					title: "Zdjęcie z tortem weselnym",
				},
			],
		});
	});
});
