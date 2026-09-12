// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GDriveExportModal } from "@/components/owner/GDriveExportModal";

describe("GDriveExportModal Component", () => {
	it("nie powinien renderować niczego, gdy isOpen jest równe false", () => {
		const { container } = render(
			<GDriveExportModal
				isOpen={false}
				coupleNames="Kasia i Tomek"
				includeHidden={false}
				setIncludeHidden={vi.fn()}
				exportLoading={false}
				onClose={vi.fn()}
				onStartExport={vi.fn()}
			/>,
		);

		expect(container.firstChild).toBeNull();
	});

	it("powinien wyświetlić modal, przełączyć zakres eksportu i wywołać akcje", () => {
		const setIncludeHiddenMock = vi.fn();
		const onCloseMock = vi.fn();
		const onStartExportMock = vi.fn();

		render(
			<GDriveExportModal
				isOpen={true}
				coupleNames="Kasia i Tomek"
				includeHidden={false}
				setIncludeHidden={setIncludeHiddenMock}
				exportLoading={false}
				onClose={onCloseMock}
				onStartExport={onStartExportMock}
			/>,
		);

		expect(screen.getByText("Eksport na Dysk Google")).toBeInTheDocument();
		expect(screen.getByText("WeddingDrop - Kasia i Tomek")).toBeInTheDocument();

		// Kliknięcie radio "Prześlij wszystko"
		const radioAll = screen.getByLabelText(/Prześlij wszystko/i);
		fireEvent.click(radioAll);
		expect(setIncludeHiddenMock).toHaveBeenCalledWith(true);

		// Kliknięcie "Rozpocznij eksport"
		const exportBtn = screen.getByRole("button", {
			name: /Rozpocznij eksport/i,
		});
		fireEvent.click(exportBtn);
		expect(onStartExportMock).toHaveBeenCalledTimes(1);

		// Kliknięcie "Anuluj"
		const cancelBtn = screen.getByRole("button", { name: /Anuluj/i });
		fireEvent.click(cancelBtn);
		expect(onCloseMock).toHaveBeenCalledTimes(1);
	});

	it("powinien pokazać wskaźnik ładowania, gdy exportLoading jest równe true", () => {
		render(
			<GDriveExportModal
				isOpen={true}
				coupleNames="Kasia i Tomek"
				includeHidden={true}
				setIncludeHidden={vi.fn()}
				exportLoading={true}
				onClose={vi.fn()}
				onStartExport={vi.fn()}
			/>,
		);

		expect(screen.getByText("Inicjalizacja...")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Inicjalizacja.../i }),
		).toBeDisabled();
	});
});
