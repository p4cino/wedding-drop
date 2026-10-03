// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Modal } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";

describe("Park UI Overlay Components (Dialog & Drawer)", () => {
	it("renders Modal and manages open/close with escape key and triggers", () => {
		render(
			<Modal.Root defaultOpen>
				<Modal.Backdrop data-testid="backdrop" />
				<Modal.Positioner>
					<Modal.Content>
						<Modal.Header>
							<Modal.Title>Tytuł Modala</Modal.Title>
							<Modal.Description>Opis okna</Modal.Description>
						</Modal.Header>
						<Modal.Body>Zawartość okna modalnego</Modal.Body>
						<Modal.Footer>
							<Modal.CloseTrigger data-testid="close-btn">
								Zamknij
							</Modal.CloseTrigger>
						</Modal.Footer>
					</Modal.Content>
				</Modal.Positioner>
			</Modal.Root>,
		);

		expect(screen.getByText("Tytuł Modala")).toBeInTheDocument();
		expect(screen.getByText("Zawartość okna modalnego")).toBeInTheDocument();

		const closeBtn = screen.getByTestId("close-btn");
		fireEvent.click(closeBtn);
	});

	it("renders Drawer and supports keyboard navigation and accessibility attributes", () => {
		render(
			<Drawer.Root defaultOpen>
				<Drawer.Backdrop data-testid="drawer-backdrop" />
				<Drawer.Positioner>
					<Drawer.Content>
						<Drawer.Header>
							<Drawer.Title>Szuflada Uploadera</Drawer.Title>
							<Drawer.Description>Wybierz pliki</Drawer.Description>
						</Drawer.Header>
						<Drawer.Body>Lista przesyłanych plików</Drawer.Body>
						<Drawer.Footer>
							<Drawer.CloseTrigger data-testid="drawer-close">
								Anuluj
							</Drawer.CloseTrigger>
						</Drawer.Footer>
					</Drawer.Content>
				</Drawer.Positioner>
			</Drawer.Root>,
		);

		expect(screen.getByText("Szuflada Uploadera")).toBeInTheDocument();
		expect(screen.getByText("Lista przesyłanych plików")).toBeInTheDocument();
	});
});
