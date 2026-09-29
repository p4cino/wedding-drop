import { db, wishes } from "@wedding-drop/db";
import { sseBus } from "@wedding-drop/media";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { authenticateOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(["ready", "hidden", "deleted"]);

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string; id: string }> },
) {
	try {
		const { slug, id: wishId } = await params;
		const body = await req.json();

		const auth = await authenticateOwner(req, slug, body);
		if (!auth.authorized || !auth.gallery) {
			return NextResponse.json(
				{ error: auth.errorMessage || "Brak autoryzacji" },
				{ status: auth.errorStatus || 401 },
			);
		}

		const { newStatus } = body;
		const validStatus = VALID_STATUSES.has(newStatus) ? newStatus : "ready";

		await db
			.update(wishes)
			.set({ status: validStatus })
			.where(and(eq(wishes.id, wishId), eq(wishes.galleryId, auth.gallery.id)));

		// Powiadomienie gości w czasie rzeczywistym o zmianie widoczności życzenia
		sseBus.notifyWishUpdated(slug, { wishId, status: validStatus });

		return NextResponse.json({ success: true, newStatus: validStatus });
	} catch (error) {
		console.error("Błąd aktualizacji statusu życzenia:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
