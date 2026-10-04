import {
	cardSettings,
	db,
	type galleries,
	galleryBranding,
	type galleryGdriveExports,
	mediaItems,
} from "@wedding-drop/db";
import { isGoogleDriveConfigured } from "@wedding-drop/media";
import { eq, sql } from "drizzle-orm";

type GalleryRow = typeof galleries.$inferSelect;
type GDriveRow = typeof galleryGdriveExports.$inferSelect | null | undefined;

/**
 * Dane panelu właściciela (galeria, statystyki, winietka, stan Google Drive) — wspólne
 * dla logowania hasłem (`POST .../auth`) i odtwarzania sesji tokenem (`GET .../session`),
 * żeby oba kształty odpowiedzi nie mogły się rozjechać.
 */
export async function buildOwnerPanelPayload(
	gallery: GalleryRow,
	gdrive: GDriveRow,
) {
	const stats = await db
		.select({
			totalFiles: sql<number>`count(*)`,
			totalBytes: sql<number>`COALESCE(sum(${mediaItems.fileSize}), 0)`,
		})
		.from(mediaItems)
		.where(eq(mediaItems.galleryId, gallery.id));

	const card = await db
		.select()
		.from(cardSettings)
		.where(eq(cardSettings.galleryId, gallery.id))
		.limit(1);

	const branding = await db
		.select()
		.from(galleryBranding)
		.where(eq(galleryBranding.galleryId, gallery.id))
		.limit(1);

	return {
		success: true,
		gallery: {
			id: gallery.id,
			slug: gallery.slug,
			coupleNames: gallery.coupleNames,
			weddingDate: gallery.weddingDate,
			allowGuestDownloads: gallery.allowGuestDownloads,
			allowVideos: gallery.allowVideos,
			allowGuestUploads: gallery.allowGuestUploads,
			allowGuestViewing: gallery.allowGuestViewing,
			isApprovalQueueEnabled: gallery.isApprovalQueueEnabled,
			hasGDrive: Boolean(gdrive?.refreshToken),
			gdriveAccountEmail: gdrive?.accountEmail,
			gdriveExportStatus: gdrive?.exportStatus,
			gdriveExportProgress: gdrive?.exportProgress || null,
			gdriveExportedAt: gdrive?.exportedAt,
			gdriveRootFolderId: gdrive?.rootFolderId,
			branding: branding[0]
				? {
						logoPath: branding[0].logoPath,
						backgroundPath: branding[0].backgroundPath,
					}
				: null,
		},
		stats: stats[0] || { totalFiles: 0, totalBytes: 0 },
		cardSettings: card[0] || null,
		isGDriveConfigured: isGoogleDriveConfigured(),
	};
}
