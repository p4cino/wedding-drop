import fs from "node:fs/promises";
import path from "node:path";
import { db, mediaItems } from "@wedding-drop/db";
import { sseBus } from "@wedding-drop/media";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { authenticateOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string; id: string }> },
) {
	try {
		const { slug, id: mediaId } = await params;
		let body: any = null;
		try {
			body = await req.json();
		} catch (_e) {
			// Body is optional for DELETE
		}

		const auth = await authenticateOwner(req, slug, body);
		if (!auth.authorized || !auth.gallery) {
			return NextResponse.json(
				{ error: auth.errorMessage || "Brak autoryzacji" },
				{ status: auth.errorStatus || 401 },
			);
		}

		const itemResult = await db
			.select()
			.from(mediaItems)
			.where(
				and(
					eq(mediaItems.id, mediaId),
					eq(mediaItems.galleryId, auth.gallery.id),
				),
			)
			.limit(1);

		if (itemResult.length) {
			const item = itemResult[0];
			const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");

			// Usunięcie plików z dysku
			await fs.unlink(path.join(dataDir, item.storagePath)).catch(() => {});
			await fs.unlink(path.join(dataDir, item.thumbPath)).catch(() => {});

			await db.delete(mediaItems).where(eq(mediaItems.id, mediaId));

			// Powiadomienie gości w czasie rzeczywistym o usunięciu
			sseBus.notifyMediaUpdated(slug, { mediaId, status: "deleted" });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Błąd usuwania pliku:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
