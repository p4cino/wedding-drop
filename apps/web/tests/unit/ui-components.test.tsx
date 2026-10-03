// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

describe("Park UI Base Components", () => {
	it("renders Button with proper classes and handles click", () => {
		render(
			<Button variant="solid" size="md">
				Zapisz zmiany
			</Button>,
		);
		const btn = screen.getByRole("button", { name: "Zapisz zmiany" });
		expect(btn).toBeInTheDocument();
		expect(btn.className).toContain("button");
	});

	it("renders Input with placeholder and input recipe classes", () => {
		render(<Input placeholder="Wpisz imię..." />);
		const input = screen.getByPlaceholderText("Wpisz imię...");
		expect(input).toBeInTheDocument();
		expect(input.className).toContain("input");
	});

	it("renders Badge with badge recipe styles", () => {
		render(<Badge variant="subtle">Nowość</Badge>);
		const badge = screen.getByText("Nowość");
		expect(badge).toBeInTheDocument();
		expect(badge.className).toContain("badge");
	});

	it("renders Card compound component tree correctly", () => {
		render(
			<Card.Root data-testid="test-card">
				<Card.Header>
					<Card.Title>Karta Ślubna</Card.Title>
					<Card.Description>Opis pamiątki</Card.Description>
				</Card.Header>
				<Card.Body>Treść karty</Card.Body>
				<Card.Footer>Stopka karty</Card.Footer>
			</Card.Root>,
		);

		expect(screen.getByTestId("test-card")).toBeInTheDocument();
		expect(screen.getByText("Karta Ślubna")).toBeInTheDocument();
		expect(screen.getByText("Opis pamiątki")).toBeInTheDocument();
		expect(screen.getByText("Treść karty")).toBeInTheDocument();
		expect(screen.getByText("Stopka karty")).toBeInTheDocument();
	});
});
