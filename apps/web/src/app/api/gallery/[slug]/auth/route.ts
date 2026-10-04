import { db, galleries } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { generateGuestToken, setGuestSessionCookie } from "@/lib/auth";
import { hashSecret, verifySecret } from "@/lib/credential";
import {
	AUTH_FAILURE_LIMIT,
	getClientIp,
	peekRateLimit,
	recordRateLimitHit,
	resetRateLimit,
	tooManyRequests,
} from "@/lib/rate-limit";

export async function POST(
	req: NextRequest,
	props: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await props.params;

		const key = `${getClientIp(req.headers)}:${slug}`;
		const limit = peekRateLimit("guest-login", key, AUTH_FAILURE_LIMIT);
		if (!limit.ok) return tooManyRequests(limit.retryAfter);

		const body = await req.json().catch(() => null);
		const password = body?.password;

		if (!password || typeof password !== "string") {
			return NextResponse.json(
				{ error: "Hasło jest wymagane" },
				{ status: 400 },
			);
		}

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

		if (!gallery.guestPassword) {
			return NextResponse.json(
				{ error: "Galeria nie wymaga hasła" },
				{ status: 400 },
			);
		}

		const result = await verifySecret(gallery.guestPassword, password);
		if (!result.valid) {
			const after = recordRateLimitHit("guest-login", key, AUTH_FAILURE_LIMIT);
			if (!after.ok) return tooManyRequests(after.retryAfter);
			return NextResponse.json(
				{ error: "Nieprawidłowe hasło" },
				{ status: 401 },
			);
		}

		resetRateLimit("guest-login", key);

		// Lazy-upgrade: stare hasła zapisane plaintextem zamieniamy na hash bcrypt
		if (result.needsUpgrade) {
			await db
				.update(galleries)
				.set({ guestPassword: await hashSecret(password) })
				.where(eq(galleries.id, gallery.id));
		}

		const token = generateGuestToken(slug);
		const response = NextResponse.json({ success: true });
		setGuestSessionCookie(response, slug, token);

		return response;
	} catch (error) {
		console.error("Auth error:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
