import { describe, expect, it } from "vitest";
import {
	gdriveDisconnectedUpdate,
	gdriveStateFromPanel,
	gdriveUpdateFromPoll,
	gdriveUpdateFromSse,
	initialGDriveState,
	parseGDriveReturn,
} from "@/lib/gdrive-state";
import type { OwnerPanelData } from "@/lib/owner-types";

const panel = (
	gallery: Partial<OwnerPanelData["gallery"]>,
	configured?: boolean,
): OwnerPanelData => ({
	success: true,
	gallery: { id: "1", slug: "s", ...gallery },
	stats: { totalFiles: 0, totalBytes: 0 },
	isGDriveConfigured: configured,
});

describe("gdrive-state", () => {
	it("gdriveStateFromPanel mapuje pełny ładunek", () => {
		const progress = { totalFiles: 10, processedFiles: 3 };
		expect(
			gdriveStateFromPanel(
				panel({
					hasGDrive: true,
					gdriveAccountEmail: "a@b.pl",
					gdriveExportStatus: "running",
					gdriveExportProgress: progress,
					gdriveRootFolderId: "f1",
					gdriveExportedAt: "2026-09-12T12:00:00.000Z",
				}),
			),
		).toEqual({
			isConfigured: true,
			connected: true,
			email: "a@b.pl",
			status: "running",
			progress,
			folderId: "f1",
			exportedAt: "2026-09-12T12:00:00.000Z",
		});
	});

	it("gdriveStateFromPanel stosuje wartości domyślne i respektuje isGDriveConfigured=false", () => {
		expect(gdriveStateFromPanel(panel({}, false))).toEqual({
			...initialGDriveState,
			isConfigured: false,
		});
	});

	it("gdriveUpdateFromSse ustawia postęp, status i folder tylko gdy są w zdarzeniu", () => {
		expect(gdriveUpdateFromSse(undefined)).toEqual({});
		expect(gdriveUpdateFromSse({ processedFiles: 1 })).toEqual({
			progress: { processedFiles: 1 },
		});
		expect(
			gdriveUpdateFromSse({
				processedFiles: 2,
				status: "completed",
				rootFolderId: "f",
			}),
		).toMatchObject({ status: "completed", folderId: "f" });
	});

	it("gdriveUpdateFromPoll pomija brakujące pola", () => {
		expect(gdriveUpdateFromPoll({})).toEqual({});
		expect(
			gdriveUpdateFromPoll({
				gdriveExportStatus: "completed",
				gdriveExportProgress: { totalFiles: 1 },
				gdriveRootFolderId: "f",
				gdriveExportedAt: "d",
			}),
		).toEqual({
			status: "completed",
			progress: { totalFiles: 1 },
			folderId: "f",
			exportedAt: "d",
		});
	});

	it("gdriveDisconnectedUpdate czyści połączenie", () => {
		expect(gdriveDisconnectedUpdate).toEqual({
			connected: false,
			email: null,
			status: "idle",
			progress: null,
		});
	});

	it("parseGDriveReturn rozpoznaje powrót z OAuth", () => {
		expect(parseGDriveReturn("?gdrive=connected")).toEqual({ type: "success" });
		expect(parseGDriveReturn("?gdrive_error=denied")).toEqual({
			type: "error",
			error: "denied",
		});
		expect(parseGDriveReturn("?inne=1")).toBeNull();
		expect(parseGDriveReturn("")).toBeNull();
	});
});
