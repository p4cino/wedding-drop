import { db, galleries } from "@wedding-drop/db";
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

		const g = auth.gallery;
		let progress = null;
		try {
			if (g.gdriveExportProgress) {
				progress = JSON.parse(g.gdriveExportProgress);
			}
		} catch (_e) {}

		return NextResponse.json({
			success: true,
			hasGDrive: Boolean(g.gdriveRefreshToken),
			gdriveAccountEmail: g.gdriveAccountEmail,
			gdriveExportStatus: g.gdriveExportStatus,
			gdriveExportProgress: progress,
			gdriveExportedAt: g.gdriveExportedAt,
			gdriveRootFolderId: g.gdriveRootFolderId,
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
		let body: any = null;
		try {
			body = await req.json();
		} catch (_e) {
			// Body is optional
		}

		const auth = await authenticateOwner(req, slug, body);
		if (!auth.authorized || !auth.gallery) {
			return NextResponse.json(
				{ error: auth.errorMessage || "Brak autoryzacji" },
				{ status: auth.errorStatus || 401 },
			);
		}

		await db
			.update(galleries)
			.set({
				gdriveRefreshToken: null,
				gdriveAccountEmail: null,
				gdriveExportStatus: "idle",
				gdriveExportProgress: null,
			})
			.where(eq(galleries.id, auth.gallery.id));

		return NextResponse.json({
			success: true,
			message: "Konto Google Drive zostało odłączone.",
		});
	} catch (error) {
		console.error("Błąd odłączania Google Drive:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
