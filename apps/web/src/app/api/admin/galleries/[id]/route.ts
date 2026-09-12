import fs from "node:fs/promises";
import path from "node:path";
import { db, galleries } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getAdminTokenFromRequest(req: NextRequest, body?: any): string | null {
	return (
		req.headers.get("x-admin-token") ||
		req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
		new URL(req.url).searchParams.get("token") ||
		body?.token ||
		null
	);
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		let body: any = null;
		try {
			body = await req.json();
		} catch (_e) {
			// Body is optional for DELETE
		}

		const token = getAdminTokenFromRequest(req, body);
		if (!verifyAdminToken(token)) {
			return NextResponse.json(
				{ error: "Brak uprawnień administratora" },
				{ status: 401 },
			);
		}

		const { id: galleryId } = await params;
		const target = await db
			.select()
			.from(galleries)
			.where(eq(galleries.id, galleryId))
			.limit(1);

		if (target.length) {
			const slug = target[0].slug;
			const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");

			// Usunięcie z bazy (kaskada usunie wpisy w media_items i card_settings)
			await db.delete(galleries).where(eq(galleries.id, galleryId));

			// Usunięcie plików z dysku
			await fs
				.rm(path.join(dataDir, "galleries", slug), {
					recursive: true,
					force: true,
				})
				.catch(() => {});
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Błąd usuwania galerii:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
