import {
	cardSettings,
	db,
	galleries,
	galleryGdriveExports,
	mediaItems,
} from "@wedding-drop/db";
import { isGoogleDriveConfigured } from "@wedding-drop/media";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { generateOwnerToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
		const body = await req.json();
		const { password } = body;

		const galleryResult = await db
			.select({ gallery: galleries, gdrive: galleryGdriveExports })
			.from(galleries)
			.leftJoin(
				galleryGdriveExports,
				eq(galleries.id, galleryGdriveExports.galleryId),
			)
			.where(eq(galleries.slug, slug))
			.limit(1);

		if (!galleryResult.length) {
			return NextResponse.json(
				{ error: "Galeria nie istnieje" },
				{ status: 404 },
			);
		}

		const { gallery, gdrive } = galleryResult[0];

		const isValid = await bcrypt.compare(password, gallery.ownerPasswordHash);
		if (!isValid) {
			return NextResponse.json(
				{ error: "Nieprawidłowe hasło" },
				{ status: 401 },
			);
		}

		// Pobieranie statystyk
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

		const progressParsed = gdrive?.exportProgress || null;

		return NextResponse.json({
			success: true,
			ownerToken: generateOwnerToken(slug),
			gallery: {
				id: gallery.id,
				slug: gallery.slug,
				coupleNames: gallery.coupleNames,
				weddingDate: gallery.weddingDate,
				allowGuestDownloads: gallery.allowGuestDownloads,
				allowVideos: gallery.allowVideos,
				hasGDrive: Boolean(gdrive?.refreshToken),
				gdriveAccountEmail: gdrive?.accountEmail,
				gdriveExportStatus: gdrive?.exportStatus,
				gdriveExportProgress: progressParsed,
				gdriveExportedAt: gdrive?.exportedAt,
				gdriveRootFolderId: gdrive?.rootFolderId,
			},
			stats: stats[0] || { totalFiles: 0, totalBytes: 0 },
			cardSettings: card[0] || null,
			isGDriveConfigured: isGoogleDriveConfigured(),
		});
	} catch (error) {
		console.error("Błąd w endpoint owner auth:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
