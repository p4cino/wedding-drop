import { db, galleries, mediaItems } from "@wedding-drop/db";
import { toggleMediaLikeDto } from "@wedding-drop/db/validators";
import { sseBus } from "@wedding-drop/media";
import { and, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { hasGuestAccess } from "@/lib/auth";
import {
	getClientIp,
	recordRateLimitHit,
	tooManyRequests,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MEDIA_LIKE_LIMIT = {
	max: 60,
	windowMs: 60_000,
};

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string; id: string }> },
) {
	try {
		const { slug, id } = await params;
		const galleryResult = await db
			.select()
			.from(galleries)
			.where(eq(galleries.slug, slug))
			.limit(1);

		if (!galleryResult.length) {
			return NextResponse.json(
				{ error: "Galeria nie istnieje" },
				{ status: 404 },
			);
		}

		const gallery = galleryResult[0];

		if (gallery.isActive === false) {
			return NextResponse.json(
				{ error: "Galeria jest nieaktywna" },
				{ status: 403 },
			);
		}

		if (gallery.allowGuestViewing === false) {
			return NextResponse.json(
				{ error: "Podgląd galerii przez gości jest wyłączony" },
				{ status: 403 },
			);
		}

		if (!hasGuestAccess(req, slug, gallery.guestPassword)) {
			return NextResponse.json(
				{ error: "Wymagana autoryzacja gościa" },
				{ status: 401 },
			);
		}

		const rl = recordRateLimitHit(
			"media-like",
			`${getClientIp(req.headers)}:${slug}`,
			MEDIA_LIKE_LIMIT,
		);
		if (!rl.ok) return tooManyRequests(rl.retryAfter);

		const body = await req.json().catch(() => null);
		const parsed = toggleMediaLikeDto.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{
					error:
						parsed.error.issues[0]?.message || "Nieprawidłowa akcja reakcji",
				},
				{ status: 400 },
			);
		}

		const nextLikesExpr =
			parsed.data.action === "like"
				? sql`${mediaItems.likesCount} + 1`
				: sql`GREATEST(0, ${mediaItems.likesCount} - 1)`;

		const updatedRows = await db
			.update(mediaItems)
			.set({ likesCount: nextLikesExpr })
			.where(
				and(
					eq(mediaItems.id, id),
					eq(mediaItems.galleryId, gallery.id),
					eq(mediaItems.status, "ready"),
				),
			)
			.returning({
				id: mediaItems.id,
				likesCount: mediaItems.likesCount,
			});

		const updated = updatedRows[0];
		if (!updated) {
			return NextResponse.json(
				{ error: "Materiał nie istnieje" },
				{ status: 404 },
			);
		}

		sseBus.notifyMediaLiked(slug, {
			mediaId: updated.id,
			likesCount: updated.likesCount,
		});

		return NextResponse.json({
			id: updated.id,
			likesCount: updated.likesCount,
		});
	} catch (error) {
		console.error("Błąd aktualizacji reakcji medium:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
