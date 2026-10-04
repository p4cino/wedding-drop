import { db, galleryGdriveExports } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import {
	authenticateOwner,
	clearOwnerSessionCookie,
	generateOwnerToken,
	ownerSessionCookieName,
	readOwnerToken,
	revokeToken,
	setOwnerSessionCookie,
} from "@/lib/auth";
import { buildOwnerPanelPayload } from "@/lib/owner-panel-payload";

export const dynamic = "force-dynamic";

/**
 * Odtwarzanie sesji panelu właściciela na podstawie ciasteczka sesyjnego lub podpisanego tokenu HMAC,
 * bez ponownego podawania hasła. Zwraca pełny ładunek panelu oraz odświeża token i ciasteczko sesyjne.
 */
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
		const auth = await authenticateOwner(req, slug);
		if (!auth.authorized || !auth.gallery) {
			return NextResponse.json(
				{ error: auth.errorMessage || "Brak aktywnej sesji" },
				{ status: auth.errorStatus ?? 401 },
			);
		}

		const gdriveRows = await db
			.select()
			.from(galleryGdriveExports)
			.where(eq(galleryGdriveExports.galleryId, auth.gallery.id))
			.limit(1);

		const payload = await buildOwnerPanelPayload(auth.gallery, gdriveRows[0]);
		const freshToken = generateOwnerToken(slug);

		const res = NextResponse.json({
			...payload,
			ownerToken: freshToken,
		});
		setOwnerSessionCookie(res, slug, freshToken);
		return res;
	} catch (error) {
		console.error("Błąd w endpoint owner session GET:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
		// Unieważniamy token z nagłówka oraz ten niesiony w ciasteczku sesji
		revokeToken(readOwnerToken(req, slug));
		revokeToken(req.cookies.get(ownerSessionCookieName(slug))?.value);
		const res = NextResponse.json({ success: true });
		clearOwnerSessionCookie(res, slug);
		return res;
	} catch (error) {
		console.error("Błąd w endpoint owner session DELETE:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
