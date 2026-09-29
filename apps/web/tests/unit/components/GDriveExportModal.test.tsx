// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GDriveExportModal } from "@/components/owner/GDriveExportModal";

const renderModal = (
	over: Partial<React.ComponentProps<typeof GDriveExportModal>> = {},
) =>
	render(
		<GDriveExportModal
			isOpen={true}
			coupleNames="Kasia i Tomek"
			onClose={vi.fn()}
			onStartExport={vi.fn().mockResolvedValue(true)}
			{...over}
		/>,
	);

describe("GDriveExportModal Component", () => {
	it("nie powinien renderować niczego, gdy isOpen jest równe false", () => {
		const { container } = renderModal({ isOpen: false });
		expect(container.firstChild).toBeNull();
	});

	it("powinien wyświetlić modal i anulować przez przycisk", () => {
		const onClose = vi.fn();
		renderModal({ onClose });

		expect(screen.getByText("modalTitle")).toBeInTheDocument();
		expect(screen.getByText("WeddingDrop - Kasia i Tomek")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "cancelBtn" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("domyślnie eksportuje wszystko (z ukrytymi) i po sukcesie zamyka modal", async () => {
		const onStartExport = vi.fn().mockResolvedValue(true);
		const onClose = vi.fn();
		renderModal({ onStartExport, onClose });

		fireEvent.click(screen.getByRole("button", { name: "startBtn" }));
		await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
		expect(onStartExport).toHaveBeenCalledWith(true);
	});

	it("po przełączeniu na tylko widoczne przekazuje includeHidden=false", async () => {
		const onStartExport = vi.fn().mockResolvedValue(true);
		renderModal({ onStartExport });

		fireEvent.click(screen.getByLabelText("scopeVisible", { exact: false }));
		fireEvent.click(screen.getByRole("button", { name: "startBtn" }));
		await waitFor(() => expect(onStartExport).toHaveBeenCalledWith(false));

		fireEvent.click(screen.getByLabelText("scopeAll", { exact: false }));
		fireEvent.click(screen.getByRole("button", { name: "startBtn" }));
		await waitFor(() => expect(onStartExport).toHaveBeenLastCalledWith(true));
	});

	it("po nieudanym starcie eksportu modal pozostaje otwarty", async () => {
		const onStartExport = vi.fn().mockResolvedValue(false);
		const onClose = vi.fn();
		renderModal({ onStartExport, onClose });

		fireEvent.click(screen.getByRole("button", { name: "startBtn" }));
		await waitFor(() => expect(onStartExport).toHaveBeenCalled());
		await waitFor(() =>
			expect(screen.getByRole("button", { name: "startBtn" })).toBeEnabled(),
		);
		expect(onClose).not.toHaveBeenCalled();
	});

	it("pokazuje wskaźnik ładowania i blokuje Escape oraz Anuluj w trakcie eksportu", async () => {
		let resolveExport: (ok: boolean) => void = () => {};
		const onStartExport = vi.fn(
			() =>
				new Promise<boolean>((resolve) => {
					resolveExport = resolve;
				}),
		);
		const onClose = vi.fn();
		renderModal({ onStartExport, onClose });

		fireEvent.click(screen.getByRole("button", { name: "startBtn" }));
		expect(
			await screen.findByRole("button", { name: "initBtn" }),
		).toBeDisabled();
		expect(screen.getByRole("button", { name: "cancelBtn" })).toBeDisabled();

		fireEvent.keyDown(window, { key: "Escape" });
		expect(onClose).not.toHaveBeenCalled();

		resolveExport(false);
		await waitFor(() =>
			expect(screen.getByRole("button", { name: "startBtn" })).toBeEnabled(),
		);
	});

	it("zamyka się po wciśnięciu Escape, gdy nie trwa eksport", () => {
		const onClose = vi.fn();
		renderModal({ onClose });
		fireEvent.keyDown(window, { key: "Escape" });
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("trzyma fokus wewnątrz modala i przywraca go na element otwierający po zamknięciu", () => {
		const opener = document.createElement("button");
		document.body.appendChild(opener);
		opener.focus();

		const { rerender } = renderModal();
		const dialog = screen.getByRole("dialog");
		expect(dialog.contains(document.activeElement)).toBe(true);

		screen.getByRole("button", { name: "startBtn" }).focus();
		fireEvent.keyDown(window, { key: "Tab" });
		expect(dialog.contains(document.activeElement)).toBe(true);
		expect(document.activeElement).not.toBe(opener);

		rerender(
			<GDriveExportModal
				isOpen={false}
				coupleNames="Kasia i Tomek"
				onClose={vi.fn()}
				onStartExport={vi.fn()}
			/>,
		);
		expect(document.activeElement).toBe(opener);
		opener.remove();
	});
});
