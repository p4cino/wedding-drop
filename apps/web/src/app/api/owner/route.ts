import { NextRequest, NextResponse } from "next/server";
import { POST as authPost } from "./[slug]/auth/route";
import { PUT as cardPut } from "./[slug]/card/route";
import { POST as gdriveExportPost } from "./[slug]/gdrive/export/route";
import {
	DELETE as gdriveDelete,
	GET as gdriveGet,
} from "./[slug]/gdrive/route";
import { DELETE as mediaDelete } from "./[slug]/media/[id]/route";
import { PATCH as statusPatch } from "./[slug]/media/[id]/status/route";

export const dynamic = "force-dynamic";

/**
 * Kompatybilność wsteczna dla legacy zapytań RPC /api/owner
 * Nowy standard REST (Next.js 16 App Router):
 * - POST /api/owner/[slug]/auth
 * - PATCH /api/owner/[slug]/media/[id]/status
 * - DELETE /api/owner/[slug]/media/[id]
 * - PUT /api/owner/[slug]/card
 * - GET/DELETE /api/owner/[slug]/gdrive
 * - POST /api/owner/[slug]/gdrive/export
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { action, slug } = body;

		if (!slug && action !== "login") {
			return NextResponse.json(
				{ error: "Brak parametru slug" },
				{ status: 400 },
			);
		}

		if (action === "login") {
			const forwardReq = new NextRequest(
				new URL(`/api/owner/${slug}/auth`, req.url),
				{
					method: "POST",
					headers: req.headers,
					body: JSON.stringify(body),
				},
			);
			return authPost(forwardReq, { params: Promise.resolve({ slug }) });
		}

		if (action === "toggle-status") {
			const forwardReq = new NextRequest(
				new URL(`/api/owner/${slug}/media/${body.mediaId}/status`, req.url),
				{
					method: "PATCH",
					headers: req.headers,
					body: JSON.stringify(body),
				},
			);
			return statusPatch(forwardReq, {
				params: Promise.resolve({ slug, id: body.mediaId }),
			});
		}

		if (action === "delete-media") {
			const forwardReq = new NextRequest(
				new URL(`/api/owner/${slug}/media/${body.mediaId}`, req.url),
				{
					method: "DELETE",
					headers: req.headers,
					body: JSON.stringify(body),
				},
			);
			return mediaDelete(forwardReq, {
				params: Promise.resolve({ slug, id: body.mediaId }),
			});
		}

		if (action === "update-card") {
			const forwardReq = new NextRequest(
				new URL(`/api/owner/${slug}/card`, req.url),
				{
					method: "PUT",
					headers: req.headers,
					body: JSON.stringify(body),
				},
			);
			return cardPut(forwardReq, { params: Promise.resolve({ slug }) });
		}

		if (action === "start-gdrive-export") {
			const forwardReq = new NextRequest(
				new URL(`/api/owner/${slug}/gdrive/export`, req.url),
				{
					method: "POST",
					headers: req.headers,
					body: JSON.stringify(body),
				},
			);
			return gdriveExportPost(forwardReq, {
				params: Promise.resolve({ slug }),
			});
		}

		if (action === "disconnect-gdrive") {
			const forwardReq = new NextRequest(
				new URL(`/api/owner/${slug}/gdrive`, req.url),
				{
					method: "DELETE",
					headers: req.headers,
					body: JSON.stringify(body),
				},
			);
			return gdriveDelete(forwardReq, { params: Promise.resolve({ slug }) });
		}

		if (action === "get-gdrive-status") {
			const forwardReq = new NextRequest(
				new URL(`/api/owner/${slug}/gdrive`, req.url),
				{
					method: "GET",
					headers: req.headers,
				},
			);
			return gdriveGet(forwardReq, { params: Promise.resolve({ slug }) });
		}

		return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
	} catch (error) {
		console.error("Błąd w legacy endpoint owner:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
