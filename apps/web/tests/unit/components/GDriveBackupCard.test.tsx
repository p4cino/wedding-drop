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

		expect(screen.getByText("notConnected")).toBeInTheDocument();
		const connectBtn = screen.getByRole("button", {
			name: "connectBtn",
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

		expect(screen.getByText("envWarning")).toBeInTheDocument();
		const connectBtn = screen.getByRole("button", {
			name: "connectBtn",
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

		expect(screen.getAllByText("connected")[0]).toBeInTheDocument();
		expect(screen.getByText("openFolder")).toBeInTheDocument();

		// Kliknięcie otwarcia modalu eksportu
		const exportBtn = screen.getByRole("button", {
			name: "startExportBtn",
		});
		fireEvent.click(exportBtn);
		expect(onOpenModalMock).toHaveBeenCalledTimes(1);

		// Kliknięcie odłączenia
		const disconnectBtn = screen.getByTitle("disconnectBtn");
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

		expect(screen.getByText("filesCount")).toBeInTheDocument();
		expect(screen.getByText("uploadingFile")).toBeInTheDocument();
		expect(screen.getByText("exportProgressTitle")).toBeInTheDocument();
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

		expect(screen.getByText("interruptedTitle")).toBeInTheDocument();
		expect(screen.getByText("resumeExport")).toBeInTheDocument();
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

		expect(screen.getByText("failedTitle")).toBeInTheDocument();
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

		expect(screen.getByText("completedTitle")).toBeInTheDocument();
		expect(screen.getByText("viewGDrive")).toBeInTheDocument();
	});
});
