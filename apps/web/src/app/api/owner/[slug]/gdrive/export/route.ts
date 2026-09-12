import { startGalleryDriveExport } from "@wedding-drop/media";
import { type NextRequest, NextResponse } from "next/server";
import { authenticateOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
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

		const { includeHidden } = body;
		const result = await startGalleryDriveExport(slug, {
			includeHidden: Boolean(includeHidden),
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Błąd uruchamiania eksportu Google Drive:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
