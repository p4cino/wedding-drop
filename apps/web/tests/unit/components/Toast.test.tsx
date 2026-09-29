// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Toast from "@/components/Toast";

describe("Toast", () => {
	it("nic nie renderuje bez komunikatu", () => {
		const { container } = render(
			<Toast toast={null} closeLabel="Zamknij" onClose={vi.fn()} />,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("sukces ma rolę status, błąd rolę alert", () => {
		const { rerender } = render(
			<Toast
				toast={{ type: "success", text: "OK" }}
				closeLabel="Zamknij"
				onClose={vi.fn()}
			/>,
		);
		expect(screen.getByRole("status")).toHaveTextContent("OK");
		rerender(
			<Toast
				toast={{ type: "error", text: "Błąd" }}
				closeLabel="Zamknij"
				onClose={vi.fn()}
			/>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent("Błąd");
	});

	it("przycisk zamyka komunikat", () => {
		const onClose = vi.fn();
		render(
			<Toast
				toast={{ type: "success", text: "OK" }}
				closeLabel="Zamknij"
				onClose={onClose}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Zamknij" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
