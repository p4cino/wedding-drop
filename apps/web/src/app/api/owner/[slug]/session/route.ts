import { db, galleryGdriveExports } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { authenticateOwner } from "@/lib/auth";
import { buildOwnerPanelPayload } from "@/lib/owner-panel-payload";

export const dynamic = "force-dynamic";

/**
 * Odtwarzanie sesji panelu właściciela na podstawie podpisanego tokenu HMAC
 * (nagłówek `x-owner-token`), bez ponownego podawania hasła. Zwraca ten sam ładunek
 * co logowanie, ale nie wydaje nowego tokenu.
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
				{ error: auth.errorMessage },
				{ status: auth.errorStatus ?? 401 },
			);
		}

		const gdriveRows = await db
			.select()
			.from(galleryGdriveExports)
			.where(eq(galleryGdriveExports.galleryId, auth.gallery.id))
			.limit(1);

		return NextResponse.json(
			await buildOwnerPanelPayload(auth.gallery, gdriveRows[0]),
		);
	} catch (error) {
		console.error("Błąd w endpoint owner session:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
