/** Status eksportu Google Drive zwracany przez API panelu właściciela. */
export type GDriveExportStatus =
	| "idle"
	| "running"
	| "completed"
	| "failed"
	| "interrupted";

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
	gdriveExportStatus?: string | null;
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
