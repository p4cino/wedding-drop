import { cardSettings, db } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { authenticateOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
		const body = await req.json();

		const auth = await authenticateOwner(req, slug, body);
		if (!auth.authorized || !auth.gallery) {
			return NextResponse.json(
				{ error: auth.errorMessage || "Brak autoryzacji" },
				{ status: auth.errorStatus || 401 },
			);
		}

		const {
			headline,
			subheadline,
			primaryColor,
			accentColor,
			customInstructions,
		} = body;

		const existing = await db
			.select()
			.from(cardSettings)
			.where(eq(cardSettings.galleryId, auth.gallery.id))
			.limit(1);

		if (existing.length) {
			await db
				.update(cardSettings)
				.set({
					headline,
					subheadline,
					primaryColor,
					accentColor,
					customInstructions,
				})
				.where(eq(cardSettings.galleryId, auth.gallery.id));
		} else {
			await db.insert(cardSettings).values({
				galleryId: auth.gallery.id,
				headline,
				subheadline,
				primaryColor,
				accentColor,
				customInstructions,
			});
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Błąd aktualizacji ustawień winietki:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

export const PATCH = PUT;
