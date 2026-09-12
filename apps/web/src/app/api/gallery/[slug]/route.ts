import { cardSettings, db, galleries } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
		const galleryResult = await db
			.select()
			.from(galleries)
			.where(eq(galleries.slug, slug))
			.limit(1);

		if (!galleryResult.length) {
			return NextResponse.json(
				{ error: "Galeria nie istnieje" },
				{ status: 404 },
			);
		}

		const gallery = galleryResult[0];

		// Pobranie ustawień karteczki
		const cardResult = await db
			.select()
			.from(cardSettings)
			.where(eq(cardSettings.galleryId, gallery.id))
			.limit(1);

		return NextResponse.json({
			id: gallery.id,
			slug: gallery.slug,
			coupleNames: gallery.coupleNames,
			weddingDate: gallery.weddingDate,
			isActive: gallery.isActive,
			allowGuestDownloads: gallery.allowGuestDownloads,
			allowVideos: gallery.allowVideos,
			hasPin: !!gallery.accessPin,
			cardSettings: cardResult[0] || null,
		});
	} catch (error) {
		console.error("Błąd pobierania metadanych galerii:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
