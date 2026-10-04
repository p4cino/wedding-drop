import { db, galleries } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { authenticateOwner } from "@/lib/auth";
import { hashSecret } from "@/lib/credential";

export const dynamic = "force-dynamic";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
		let body: {
			allowGuestUploads?: boolean;
			allowGuestViewing?: boolean;
			isApprovalQueueEnabled?: boolean;
			guestPassword?: string | null;
			token?: string;
		};
		try {
			body = await req.json();
		} catch (_e) {
			return NextResponse.json({ error: "Błędne żądanie" }, { status: 400 });
		}

		const auth = await authenticateOwner(req, slug, body);
		if (!auth.authorized || !auth.gallery) {
			return NextResponse.json(
				{ error: auth.errorMessage || "Brak autoryzacji" },
				{ status: auth.errorStatus || 401 },
			);
		}

		const updates: Partial<typeof galleries.$inferInsert> = {};

		if (typeof body.allowGuestUploads === "boolean") {
			updates.allowGuestUploads = body.allowGuestUploads;
		}
		if (typeof body.allowGuestViewing === "boolean") {
			updates.allowGuestViewing = body.allowGuestViewing;
		}
		if (typeof body.isApprovalQueueEnabled === "boolean") {
			updates.isApprovalQueueEnabled = body.isApprovalQueueEnabled;
		}

		if (body.guestPassword !== undefined) {
			if (body.guestPassword === null || body.guestPassword === "") {
				updates.guestPassword = null;
			} else if (typeof body.guestPassword === "string") {
				updates.guestPassword = await hashSecret(body.guestPassword);
			}
		}

		if (Object.keys(updates).length > 0) {
			await db
				.update(galleries)
				.set(updates)
				.where(eq(galleries.id, auth.gallery.id));
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Błąd zapisu ustawień moderacji:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
