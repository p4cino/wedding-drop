import {
	cardSettings,
	db,
	galleries,
	galleryGdriveExports,
	mediaItems,
} from "@wedding-drop/db";
import { isGoogleDriveConfigured } from "@wedding-drop/media";
import { eq, sql } from "drizzle-orm";

export interface OwnerSessionPayload {
	success: true;
	ownerToken: string;
	gallery: {
		id: string;
		slug: string;
		coupleNames: string;
		weddingDate: string;
		allowGuestDownloads: boolean;
		allowVideos: boolean;
		hasGDrive: boolean;
		gdriveAccountEmail: string | null | undefined;
		gdriveExportStatus: string | null | undefined;
		gdriveExportProgress: unknown;
		gdriveExportedAt: string | null | undefined;
		gdriveRootFolderId: string | null | undefined;
	};
	stats: {
		totalFiles: number;
		totalBytes: number;
	};
	cardSettings: typeof cardSettings.$inferSelect | null;
	isGDriveConfigured: boolean;
}

export async function buildOwnerSessionPayload(
	galleryId: string,
	slug: string,
	coupleNames: string,
	weddingDate: string,
	allowGuestDownloads: boolean,
	allowVideos: boolean,
	gdrive: typeof galleryGdriveExports.$inferSelect | null,
	token: string,
): Promise<OwnerSessionPayload> {
	// Pobieranie statystyk
	const stats = await db
		.select({
			totalFiles: sql<number>`count(*)`,
			totalBytes: sql<number>`COALESCE(sum(${mediaItems.fileSize}), 0)`,
		})
		.from(mediaItems)
		.where(eq(mediaItems.galleryId, galleryId));

	const card = await db
		.select()
		.from(cardSettings)
		.where(eq(cardSettings.galleryId, galleryId))
		.limit(1);

	const progressParsed = gdrive?.exportProgress || null;

	return {
		success: true,
		ownerToken: token,
		gallery: {
			id: galleryId,
			slug,
			coupleNames,
			weddingDate,
			allowGuestDownloads,
			allowVideos,
			hasGDrive: Boolean(gdrive?.refreshToken),
			gdriveAccountEmail: gdrive?.accountEmail,
			gdriveExportStatus: gdrive?.exportStatus,
			gdriveExportProgress: progressParsed,
			gdriveExportedAt: gdrive?.exportedAt
				? gdrive.exportedAt.toISOString()
				: null,
			gdriveRootFolderId: gdrive?.rootFolderId,
		},
		stats: stats[0] || { totalFiles: 0, totalBytes: 0 },
		cardSettings: card[0] || null,
		isGDriveConfigured: isGoogleDriveConfigured(),
	};
}

export async function getOwnerSessionData(
	slug: string,
	token: string,
): Promise<OwnerSessionPayload | null> {
	const galleryResult = await db
		.select({ gallery: galleries, gdrive: galleryGdriveExports })
		.from(galleries)
		.leftJoin(
			galleryGdriveExports,
			eq(galleries.id, galleryGdriveExports.galleryId),
		)
		.where(eq(galleries.slug, slug))
		.limit(1);

	if (!galleryResult.length) return null;

	const { gallery, gdrive } = galleryResult[0];

	return buildOwnerSessionPayload(
		gallery.id,
		gallery.slug,
		gallery.coupleNames,
		gallery.weddingDate,
		gallery.allowGuestDownloads,
		gallery.allowVideos,
		gdrive,
		token,
	);
}
