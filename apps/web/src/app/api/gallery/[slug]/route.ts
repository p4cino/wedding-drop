import { cardSettings, db, galleries, galleryBranding } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { hasGuestAccess } from "@/lib/auth";
import { DEFAULT_CARD_COLORS } from "@/lib/card-defaults";

export const dynamic = "force-dynamic";

export async function GET(
	req: NextRequest,
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

		const hasPassword = !!gallery.guestPassword;
		const fullAccess = hasGuestAccess(req, slug, gallery.guestPassword);

		// Pobranie ustawień karteczki
		const cardResult = await db
			.select()
			.from(cardSettings)
			.where(eq(cardSettings.galleryId, gallery.id))
			.limit(1);

		const card = cardResult[0];

		// Pobranie ustawień brandingu
		const brandingResult = await db
			.select()
			.from(galleryBranding)
			.where(eq(galleryBranding.galleryId, gallery.id))
			.limit(1);

		const branding = brandingResult[0];

		const brandingPayload = branding
			? {
					logoPath: branding.logoPath,
					backgroundPath: branding.backgroundPath,
				}
			: null;

		if (!fullAccess) {
			// Galeria z hasłem bez sesji gościa: tylko dane potrzebne do ekranu logowania
			return NextResponse.json({
				slug: gallery.slug,
				coupleNames: gallery.coupleNames,
				isActive: gallery.isActive,
				hasPassword,
				primaryColor: card?.primaryColor || DEFAULT_CARD_COLORS.primary,
				accentColor: card?.accentColor || DEFAULT_CARD_COLORS.accent,
				branding: brandingPayload,
			});
		}

		return NextResponse.json({
			hasPassword,
			id: gallery.id,
			slug: gallery.slug,
			coupleNames: gallery.coupleNames,
			weddingDate: gallery.weddingDate,
			isActive: gallery.isActive,
			allowGuestDownloads: gallery.allowGuestDownloads,
			allowVideos: gallery.allowVideos,
			hasPin: !!gallery.accessPin,
			cardSettings: card || null,
			// Kolory motywu wesela (z domyślnymi wartościami generatora winietek A6),
			// używane przez ramkę photobooth w przeglądarce gościa — reużycie tych
			// samych, publicznie już czytanych danych co GET .../card/pdf.
			primaryColor: card?.primaryColor || DEFAULT_CARD_COLORS.primary,
			accentColor: card?.accentColor || DEFAULT_CARD_COLORS.accent,
			// Nowe uprawnienia
			allowGuestViewing: gallery.allowGuestViewing,
			allowGuestUploads: gallery.allowGuestUploads,
			isApprovalQueueEnabled: gallery.isApprovalQueueEnabled,
			branding: brandingPayload,
		});
	} catch (error) {
		console.error("Błąd pobierania metadanych galerii:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
