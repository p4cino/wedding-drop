import { addWishDto, db, galleries, wishes } from "@wedding-drop/db";
import { sseBus } from "@wedding-drop/media";
import { and, desc, eq, ne } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { authorizeHiddenAccess, hasGuestAccess } from "@/lib/auth";
import {
	ANON_WRITE_LIMIT,
	getClientIp,
	recordRateLimitHit,
	tooManyRequests,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
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
		const { searchParams } = new URL(req.url);
		const includeHidden = searchParams.get("includeHidden") === "true";

		let canViewHidden = false;
		if (includeHidden) {
			const access = await authorizeHiddenAccess(
				req,
				slug,
				gallery.ownerPasswordHash,
			);
			if (access.retryAfter) return tooManyRequests(access.retryAfter);
			if (!access.granted) {
				return NextResponse.json(
					{ error: "Brak uprawnień do przeglądania ukrytych życzeń" },
					{ status: 401 },
				);
			}
			canViewHidden = true;
		} else if (!hasGuestAccess(req, slug, gallery.guestPassword)) {
			return NextResponse.json(
				{ error: "Wymagana autoryzacja gościa" },
				{ status: 401 },
			);
		}

		const condition = canViewHidden
			? and(eq(wishes.galleryId, gallery.id), ne(wishes.status, "deleted"))
			: and(eq(wishes.galleryId, gallery.id), eq(wishes.status, "ready"));

		const items = await db
			.select()
			.from(wishes)
			.where(condition)
			.orderBy(desc(wishes.createdAt));

		const formatted = items.map((w) => ({
			id: w.id,
			guestName: w.guestName,
			message: w.message,
			status: w.status,
			createdAt: w.createdAt,
		}));

		return NextResponse.json({ wishes: formatted });
	} catch (error) {
		console.error("Błąd pobierania życzeń:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
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
		if (!hasGuestAccess(req, slug, gallery.guestPassword)) {
			return NextResponse.json(
				{ error: "Wymagana autoryzacja gościa" },
				{ status: 401 },
			);
		}
		if (!gallery.isActive) {
			return NextResponse.json(
				{ error: "Galeria nie jest już aktywna" },
				{ status: 400 },
			);
		}
		if (gallery.allowGuestUploads === false) {
			return NextResponse.json(
				{ error: "Dodawanie życzeń przez gości jest wyłączone" },
				{ status: 403 },
			);
		}

		const limit = recordRateLimitHit(
			"wishes-post",
			`${getClientIp(req.headers)}:${slug}`,
			ANON_WRITE_LIMIT,
		);
		if (!limit.ok) return tooManyRequests(limit.retryAfter);

		const body = await req.json().catch(() => ({}));
		const parseResult = addWishDto.safeParse(body);
		if (!parseResult.success) {
			return NextResponse.json(
				{
					error:
						parseResult.error.issues[0]?.message ||
						"Nieprawidłowe dane życzenia",
				},
				{ status: 400 },
			);
		}

		const { guestName, message } = parseResult.data;

		const [newWish] = await db
			.insert(wishes)
			.values({
				galleryId: gallery.id,
				guestName: guestName || null,
				message,
			})
			.returning();

		// Powiadomienie gości w czasie rzeczywistym o nowym życzeniu
		sseBus.notifyNewWish(slug, newWish);

		return NextResponse.json({ success: true, wish: newWish }, { status: 201 });
	} catch (error) {
		console.error("Błąd dodawania życzenia:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
