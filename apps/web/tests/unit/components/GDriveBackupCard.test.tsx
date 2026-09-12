// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GDriveBackupCard } from "@/components/owner/GDriveBackupCard";

describe("GDriveBackupCard Component", () => {
	it("powinien renderować stan niepodłączonego Dysku Google i obsłużyć kliknięcie połączenia", () => {
		const onConnectMock = vi.fn();

		render(
			<GDriveBackupCard
				hasGDrive={false}
				gdriveEmail={null}
				gdriveStatus="idle"
				gdriveProgress={null}
				gdriveFolderId={null}
				gdriveExportedAt={null}
				isGDriveConfigured={true}
				onConnect={onConnectMock}
				onDisconnect={vi.fn()}
				onOpenExportModal={vi.fn()}
			/>,
		);

		expect(screen.getByText("Niepodłączono")).toBeInTheDocument();
		const connectBtn = screen.getByRole("button", {
			name: /Połącz z Google Drive/i,
		});
		fireEvent.click(connectBtn);
		expect(onConnectMock).toHaveBeenCalledTimes(1);
	});

	it("powinien wyświetlić ostrzeżenie gdy Google Drive nie jest skonfigurowany w środowisku", () => {
		render(
			<GDriveBackupCard
				hasGDrive={false}
				gdriveEmail={null}
				gdriveStatus="idle"
				gdriveProgress={null}
				gdriveFolderId={null}
				gdriveExportedAt={null}
				isGDriveConfigured={false}
				onConnect={vi.fn()}
				onDisconnect={vi.fn()}
				onOpenExportModal={vi.fn()}
			/>,
		);

		expect(screen.getByText(/GOOGLE_CLIENT_ID/)).toBeInTheDocument();
		const connectBtn = screen.getByRole("button", {
			name: /Połącz z Google Drive/i,
		});
		expect(connectBtn).toBeDisabled();
	});

	it("powinien renderować stan podłączonego dysku, link do folderu i obsłużyć odłączenie", () => {
		const onDisconnectMock = vi.fn();
		const onOpenModalMock = vi.fn();

		render(
			<GDriveBackupCard
				hasGDrive={true}
				gdriveEmail="mlodzi@gmail.com"
				gdriveStatus="idle"
				gdriveProgress={null}
				gdriveFolderId="folder-drive-123"
				gdriveExportedAt="2026-09-12T12:00:00.000Z"
				isGDriveConfigured={true}
				onConnect={vi.fn()}
				onDisconnect={onDisconnectMock}
				onOpenExportModal={onOpenModalMock}
			/>,
		);

		expect(screen.getAllByText(/mlodzi@gmail.com/)[0]).toBeInTheDocument();
		expect(screen.getByText("Otwórz folder na Dysku")).toBeInTheDocument();

		// Kliknięcie otwarcia modalu eksportu
		const exportBtn = screen.getByRole("button", {
			name: /Eksportuj na Dysk Google/i,
		});
		fireEvent.click(exportBtn);
		expect(onOpenModalMock).toHaveBeenCalledTimes(1);

		// Kliknięcie odłączenia
		const disconnectBtn = screen.getByTitle("Odłącz konto Google");
		fireEvent.click(disconnectBtn);
		expect(onDisconnectMock).toHaveBeenCalledTimes(1);
	});

	it("powinien wyświetlić pasek postępu podczas aktywnego eksportu (status: running)", () => {
		render(
			<GDriveBackupCard
				hasGDrive={true}
				gdriveEmail="mlodzi@gmail.com"
				gdriveStatus="running"
				gdriveProgress={{
					totalFiles: 20,
					processedFiles: 10,
					totalBytes: 20 * 1024 * 1024,
					processedBytes: 10 * 1024 * 1024,
					currentFile: "slubne_foto.jpg",
				}}
				gdriveFolderId="folder-123"
				gdriveExportedAt={null}
				isGDriveConfigured={true}
				onConnect={vi.fn()}
				onDisconnect={vi.fn()}
				onOpenExportModal={vi.fn()}
			/>,
		);

		expect(screen.getByText(/10 \/ 20 plików \(50%\)/)).toBeInTheDocument();
		expect(screen.getByText(/Wysyłanie: slubne_foto.jpg/)).toBeInTheDocument();
		expect(screen.getByText("Trwa eksport...")).toBeInTheDocument();
	});

	it("powinien wyświetlić baner o wstrzymaniu eksportu (status: interrupted)", () => {
		render(
			<GDriveBackupCard
				hasGDrive={true}
				gdriveEmail="mlodzi@gmail.com"
				gdriveStatus="interrupted"
				gdriveProgress={null}
				gdriveFolderId="folder-123"
				gdriveExportedAt={null}
				isGDriveConfigured={true}
				onConnect={vi.fn()}
				onDisconnect={vi.fn()}
				onOpenExportModal={vi.fn()}
			/>,
		);

		expect(screen.getByText("Transfer został wstrzymany")).toBeInTheDocument();
		expect(screen.getByText("Wznów eksport")).toBeInTheDocument();
	});

	it("powinien wyświetlić komunikat o błędzie podczas niepowodzenia (status: failed)", () => {
		render(
			<GDriveBackupCard
				hasGDrive={true}
				gdriveEmail="mlodzi@gmail.com"
				gdriveStatus="failed"
				gdriveProgress={{ error: "Przekroczono limit zapytań API" }}
				gdriveFolderId="folder-123"
				gdriveExportedAt={null}
				isGDriveConfigured={true}
				onConnect={vi.fn()}
				onDisconnect={vi.fn()}
				onOpenExportModal={vi.fn()}
			/>,
		);

		expect(
			screen.getByText("Wystąpił problem podczas eksportu"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Przekroczono limit zapytań API"),
		).toBeInTheDocument();
	});

	it("powinien wyświetlić komunikat o sukcesie po zakończeniu eksportu (status: completed)", () => {
		render(
			<GDriveBackupCard
				hasGDrive={true}
				gdriveEmail="mlodzi@gmail.com"
				gdriveStatus="completed"
				gdriveProgress={null}
				gdriveFolderId="folder-123"
				gdriveExportedAt="2026-09-12T15:30:00.000Z"
				isGDriveConfigured={true}
				onConnect={vi.fn()}
				onDisconnect={vi.fn()}
				onOpenExportModal={vi.fn()}
			/>,
		);

		expect(
			screen.getByText(
				"Wszystkie pliki zostały pomyślnie przesłane na Dysk Google!",
			),
		).toBeInTheDocument();
		expect(screen.getByText("Zobacz na Dysku Google")).toBeInTheDocument();
	});
});
