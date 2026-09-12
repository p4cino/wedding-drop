import { NextRequest, NextResponse } from "next/server";
import { generateAdminToken, verifyAdminToken } from "@/lib/auth";
import { POST as authPost } from "./auth/route";
import { DELETE as galleryDelete } from "./galleries/[id]/route";
import { GET as galleriesGet, POST as galleriesPost } from "./galleries/route";

export { generateAdminToken, verifyAdminToken };
export const dynamic = "force-dynamic";

/**
 * Kompatybilność wsteczna dla wywołań RPC /api/admin z action="..."
 * Nowe standardy REST zalecają:
 * - POST /api/admin/auth
 * - GET /api/admin/galleries
 * - POST /api/admin/galleries
 * - DELETE /api/admin/galleries/[id]
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { action } = body;

		if (action === "login") {
			const forwardReq = new NextRequest(new URL("/api/admin/auth", req.url), {
				method: "POST",
				headers: req.headers,
				body: JSON.stringify(body),
			});
			return authPost(forwardReq);
		}

		if (action === "list-galleries") {
			const forwardReq = new NextRequest(
				new URL("/api/admin/galleries", req.url),
				{
					method: "GET",
					headers: {
						...Object.fromEntries(req.headers.entries()),
						"x-admin-token":
							body.token || req.headers.get("x-admin-token") || "",
					},
				},
			);
			return galleriesGet(forwardReq);
		}

		if (action === "create-gallery") {
			const forwardReq = new NextRequest(
				new URL("/api/admin/galleries", req.url),
				{
					method: "POST",
					headers: {
						...Object.fromEntries(req.headers.entries()),
						"Content-Type": "application/json",
						"x-admin-token":
							body.token || req.headers.get("x-admin-token") || "",
					},
					body: JSON.stringify(body),
				},
			);
			const res = await galleriesPost(forwardReq);
			// Zachowanie kodu 200 dla legacy testów oczekujących statusu 200 na starym endpointcie
			if (res.status === 201) {
				const data = await res.json();
				return NextResponse.json(data, { status: 200 });
			}
			return res;
		}

		if (action === "delete-gallery") {
			const forwardReq = new NextRequest(
				new URL(`/api/admin/galleries/${body.galleryId}`, req.url),
				{
					method: "DELETE",
					headers: {
						...Object.fromEntries(req.headers.entries()),
						"Content-Type": "application/json",
						"x-admin-token":
							body.token || req.headers.get("x-admin-token") || "",
					},
					body: JSON.stringify(body),
				},
			);
			return galleryDelete(forwardReq, {
				params: Promise.resolve({ id: body.galleryId }),
			});
		}

		return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
	} catch (error) {
		console.error("Błąd w legacy endpoint admin:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
