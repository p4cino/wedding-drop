// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CardPreview from "@/components/CardPreview";

const base = {
	coupleNames: "Kasia i Tomek",
	weddingDate: "12.09.2026",
	headline: "Witajcie",
	primaryColor: "#111111",
	accentColor: "#222222",
	qrDataUrl: "data:qr",
	qrFailed: false,
};

describe("CardPreview", () => {
	it("renderuje dane pary, instrukcję i QR", () => {
		render(<CardPreview {...base} lines={["Zeskanuj kod", "Dodaj zdjęcia"]} />);
		expect(screen.getByText("Kasia i Tomek")).toBeInTheDocument();
		expect(screen.getByText("Zeskanuj kod")).toBeInTheDocument();
		expect(screen.getByRole("img")).toHaveAttribute("src", "data:qr");
		expect(document.getElementById("printable-card")).not.toBeNull();
	});

	it("powtarzające się linie instrukcji nie powodują ostrzeżeń o duplikacie klucza", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		render(<CardPreview {...base} lines={["Ta sama", "Ta sama", "Inna"]} />);
		expect(screen.getAllByText("Ta sama")).toHaveLength(2);
		expect(errorSpy).not.toHaveBeenCalled();
		errorSpy.mockRestore();
	});

	it("bez QR pokazuje szkielet ładowania, a przy błędzie komunikat", () => {
		const { rerender, container } = render(
			<CardPreview {...base} qrDataUrl="" lines={[]} />,
		);
		expect(container.querySelector(".animate-pulse")).not.toBeNull();
		rerender(<CardPreview {...base} qrDataUrl="" qrFailed lines={[]} />);
		expect(screen.getByRole("alert")).toHaveTextContent("qrError");
	});
});
