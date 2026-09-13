import { db, galleryGdriveExports } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { authenticateOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
		const auth = await authenticateOwner(req, slug);
		if (!auth.authorized || !auth.gallery) {
			return NextResponse.json(
				{ error: auth.errorMessage || "Brak autoryzacji" },
				{ status: auth.errorStatus || 401 },
			);
		}

		const gdriveResult = await db
			.select()
			.from(galleryGdriveExports)
			.where(eq(galleryGdriveExports.galleryId, auth.gallery.id))
			.limit(1);

		const g = gdriveResult[0] || null;
		const progress = g?.exportProgress || null;

		return NextResponse.json({
			success: true,
			hasGDrive: Boolean(g?.refreshToken),
			gdriveAccountEmail: g?.accountEmail,
			gdriveExportStatus: g?.exportStatus || "idle",
			gdriveExportProgress: progress,
			gdriveExportedAt: g?.exportedAt,
			gdriveRootFolderId: g?.rootFolderId,
		});
	} catch (error) {
		console.error("Błąd pobierania statusu Google Drive:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
		let body: { token?: string } | null = null;
		try {
			body = await req.json();
		} catch (_e) {}

		const auth = await authenticateOwner(req, slug, body);
		if (!auth.authorized || !auth.gallery) {
			return NextResponse.json(
				{ error: auth.errorMessage || "Brak autoryzacji" },
				{ status: auth.errorStatus || 401 },
			);
		}

		await db
			.delete(galleryGdriveExports)
			.where(eq(galleryGdriveExports.galleryId, auth.gallery.id));

		return NextResponse.json({
			success: true,
			message: "Konto Google Drive zostało odłączone.",
		});
	} catch (error) {
		console.error("Błąd odłączania Google Drive:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
