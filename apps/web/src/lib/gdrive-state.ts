import type {
	GDriveExportStatus,
	GDriveProgress,
	GDriveSseProgress,
	GDriveState,
	OwnerPanelData,
} from "@/lib/owner-types";

export const initialGDriveState: GDriveState = {
	isConfigured: true,
	connected: false,
	email: null,
	status: "idle",
	progress: null,
	folderId: null,
	exportedAt: null,
};

/** Stan Google Drive z odpowiedzi logowania / odtworzenia sesji. */
export function gdriveStateFromPanel(data: OwnerPanelData): GDriveState {
	const g = data.gallery;
	return {
		isConfigured: data.isGDriveConfigured ?? true,
		connected: Boolean(g?.hasGDrive),
		email: g?.gdriveAccountEmail || null,
		status: g?.gdriveExportStatus || "idle",
		progress: g?.gdriveExportProgress || null,
		folderId: g?.gdriveRootFolderId || null,
		exportedAt: g?.gdriveExportedAt || null,
	};
}

/** Zdarzenie SSE `gdrive-progress` -> częściowa aktualizacja stanu. */
export function gdriveUpdateFromSse(
	progress: GDriveSseProgress | undefined,
): Partial<GDriveState> {
	if (!progress) return {};
	const update: Partial<GDriveState> = { progress };
	if (progress.status) update.status = progress.status;
	if (progress.rootFolderId) update.folderId = progress.rootFolderId;
	return update;
}

/** Odpowiedź `GET /api/owner/[slug]/gdrive` (polling) -> częściowa aktualizacja stanu. */
export function gdriveUpdateFromPoll(data: {
	gdriveExportStatus?: GDriveExportStatus;
	gdriveExportProgress?: GDriveProgress | null;
	gdriveRootFolderId?: string | null;
	gdriveExportedAt?: string | null;
}): Partial<GDriveState> {
	const update: Partial<GDriveState> = {};
	if (data.gdriveExportStatus) update.status = data.gdriveExportStatus;
	if (data.gdriveExportProgress) update.progress = data.gdriveExportProgress;
	if (data.gdriveRootFolderId) update.folderId = data.gdriveRootFolderId;
	if (data.gdriveExportedAt) update.exportedAt = data.gdriveExportedAt;
	return update;
}

/** Stan po odłączeniu konta Google Drive. */
export const gdriveDisconnectedUpdate: Partial<GDriveState> = {
	connected: false,
	email: null,
	status: "idle",
	progress: null,
};

/** Parametry powrotu z autoryzacji Google OAuth (`?gdrive=connected` / `?gdrive_error=...`). */
export function parseGDriveReturn(
	search: string,
): { type: "success" } | { type: "error"; error: string } | null {
	const params = new URLSearchParams(search);
	if (params.get("gdrive") === "connected") return { type: "success" };
	const error = params.get("gdrive_error");
	return error ? { type: "error", error } : null;
}
