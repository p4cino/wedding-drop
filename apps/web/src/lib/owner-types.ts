/** Status eksportu Google Drive zwracany przez API panelu właściciela. */
export type GDriveExportStatus =
	| "idle"
	| "running"
	| "completed"
	| "failed"
	| "interrupted";

/** Kompletny stan Google Drive w panelu właściciela (aktualizowany atomowo). */
export interface GDriveState {
	isConfigured: boolean;
	connected: boolean;
	email: string | null;
	status: GDriveExportStatus;
	progress: GDriveProgress | null;
	folderId: string | null;
	exportedAt: string | null;
}

export interface GDriveProgress {
	totalFiles?: number;
	processedFiles?: number;
	totalBytes?: number;
	processedBytes?: number;
	currentFile?: string | null;
	error?: string | null;
}

export interface OwnerPanelGallery {
	id: string;
	slug: string;
	coupleNames?: string;
	weddingDate?: string;
	allowGuestDownloads?: boolean;
	allowVideos?: boolean;
	hasGDrive?: boolean;
	gdriveAccountEmail?: string | null;
	gdriveExportStatus?: GDriveExportStatus | null;
	gdriveExportProgress?: GDriveProgress | null;
	gdriveExportedAt?: string | null;
	gdriveRootFolderId?: string | null;
}

/** Ładunek panelu właściciela (wspólny dla `POST .../auth` i `GET .../session`). */
export interface OwnerPanelData {
	success: boolean;
	gallery: OwnerPanelGallery;
	stats: { totalFiles: number; totalBytes: number };
	isGDriveConfigured?: boolean;
}

export interface OwnerAuthResponse extends OwnerPanelData {
	ownerToken: string;
}

/** Ładunek zdarzenia SSE `gdrive-progress`. */
export type GDriveSseProgress = GDriveProgress & {
	status?: GDriveExportStatus;
	rootFolderId?: string;
};
