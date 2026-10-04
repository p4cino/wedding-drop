import { db, mediaItems } from "@wedding-drop/db";
import { sseBus } from "@wedding-drop/media";
import { and, eq, inArray } from "drizzle-orm";
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

		const pendingMedia = await db
			.select()
			.from(mediaItems)
			.where(
				and(
					eq(mediaItems.galleryId, auth.gallery.id),
					eq(mediaItems.status, "pending"),
				),
			)
			.orderBy(mediaItems.createdAt);

		return NextResponse.json({ items: pendingMedia });
	} catch (error) {
		console.error("Błąd pobierania kolejki akceptacji:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
		let body: {
			mediaIds: string[];
			action: "approve" | "reject" | "hide";
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

		if (
			!body.mediaIds ||
			!Array.isArray(body.mediaIds) ||
			body.mediaIds.length === 0
		) {
			return NextResponse.json(
				{ error: "Brak identyfikatorów mediów" },
				{ status: 400 },
			);
		}

		if (!["approve", "reject", "hide"].includes(body.action)) {
			return NextResponse.json(
				{ error: "Nieprawidłowa akcja" },
				{ status: 400 },
			);
		}

		let newStatus: "ready" | "deleted" | "hidden" = "ready";
		if (body.action === "reject") newStatus = "deleted";
		if (body.action === "hide") newStatus = "hidden";

		await db
			.update(mediaItems)
			.set({ status: newStatus })
			.where(
				and(
					eq(mediaItems.galleryId, auth.gallery.id),
					inArray(mediaItems.id, body.mediaIds),
				),
			);

		// Powiadom gości
		for (const mediaId of body.mediaIds) {
			sseBus.notifyMediaUpdated(slug, { mediaId, status: newStatus });
		}

		return NextResponse.json({
			success: true,
			action: body.action,
			updatedCount: body.mediaIds.length,
		});
	} catch (error) {
		console.error("Błąd aktualizacji kolejki akceptacji:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
