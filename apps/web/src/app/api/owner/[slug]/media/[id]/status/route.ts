import { db, mediaItems } from "@wedding-drop/db";
import { sseBus } from "@wedding-drop/media";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { authenticateOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string; id: string }> },
) {
	try {
		const { slug, id: mediaId } = await params;
		const body = await req.json();

		const auth = await authenticateOwner(req, slug, body);
		if (!auth.authorized || !auth.gallery) {
			return NextResponse.json(
				{ error: auth.errorMessage || "Brak autoryzacji" },
				{ status: auth.errorStatus || 401 },
			);
		}

		const { newStatus } = body;
		const validStatus = newStatus === "hidden" ? "hidden" : "ready";

		await db
			.update(mediaItems)
			.set({ status: validStatus })
			.where(
				and(
					eq(mediaItems.id, mediaId),
					eq(mediaItems.galleryId, auth.gallery.id),
				),
			);

		// Powiadomienie gości w czasie rzeczywistym o ukryciu/odkryciu
		sseBus.notifyMediaUpdated(slug, { mediaId, status: validStatus });

		return NextResponse.json({ success: true, newStatus: validStatus });
	} catch (error) {
		console.error("Błąd aktualizacji statusu mediów:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
