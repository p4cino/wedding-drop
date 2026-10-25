import crypto from "node:crypto";
import { compare } from "@node-rs/bcrypt";
import { db, galleries } from "@wedding-drop/db";
import { getGoogleAuthUrl, isGoogleDriveConfigured } from "@wedding-drop/media";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { verifyOwnerToken } from "@/lib/auth";
import {
	AUTH_FAILURE_LIMIT,
	getClientIp,
	peekRateLimit,
	recordRateLimitHit,
	resetRateLimit,
	tooManyRequests,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
		if (!isGoogleDriveConfigured()) {
			return NextResponse.json(
				{
					error:
						"Google Drive nie jest skonfigurowany na tym serwerze. Administrator musi ustawić GOOGLE_CLIENT_ID oraz GOOGLE_CLIENT_SECRET.",
				},
				{ status: 503 },
			);
		}

		const body = await req.json().catch(() => null);
		const slug = body?.slug;

		if (!slug || typeof slug !== "string") {
			return NextResponse.json(
				{
					error: "Wymagany jest slug galerii w ciele żądania.",
				},
				{ status: 400 },
			);
		}

		let token = req.headers.get("x-owner-token");
		if (!token) {
			const authHeader = req.headers.get("authorization");
			if (authHeader?.toLowerCase().startsWith("bearer ")) {
				token = authHeader.slice(7).trim();
			}
		}
		if (!token && body && typeof body.token === "string") {
			token = body.token;
		}

		const password =
			req.headers.get("x-owner-password") ||
			(body && typeof body.password === "string" ? body.password : null);

		if (!token && !password) {
			return NextResponse.json(
				{
					error:
						"Wymagana jest autoryzacja właściciela galerii (token lub hasło).",
				},
				{ status: 401 },
			);
		}

		if (token && !verifyOwnerToken(token, slug)) {
			return NextResponse.json(
				{ error: "Nieprawidłowy token właściciela galerii." },
				{ status: 401 },
			);
		}

		const galleryResult = await db
			.select()
			.from(galleries)
			.where(eq(galleries.slug, slug))
			.limit(1);

		if (!galleryResult.length) {
			return NextResponse.json(
				{ error: "Galeria nie istnieje." },
				{ status: 404 },
			);
		}

		if (!token && password) {
			const gallery = galleryResult[0];
			const limitKey = `${getClientIp(req.headers)}:${slug}`;
			const limit = peekRateLimit(
				"owner-password",
				limitKey,
				AUTH_FAILURE_LIMIT,
			);
			if (!limit.ok) return tooManyRequests(limit.retryAfter);
			const isValid = await compare(password, gallery.ownerPasswordHash);
			if (!isValid) {
				const after = recordRateLimitHit(
					"owner-password",
					limitKey,
					AUTH_FAILURE_LIMIT,
				);
				if (!after.ok) return tooManyRequests(after.retryAfter);
				return NextResponse.json(
					{ error: "Nieprawidłowe hasło właściciela galerii." },
					{ status: 401 },
				);
			}
			resetRateLimit("owner-password", limitKey);
		}

		const authUrl = getGoogleAuthUrl(slug);
		const res = NextResponse.json({ authUrl }, { status: 200 });

		try {
			const parsedAuthUrl = new URL(authUrl);
			const stateParam = parsedAuthUrl.searchParams.get("state");
			if (stateParam) {
				const stateDigest = crypto
					.createHash("sha256")
					.update(stateParam)
					.digest("hex");
				res.cookies.set({
					name: "wd_gdrive_oauth_state",
					value: stateDigest,
					httpOnly: true,
					sameSite: "lax",
					path: "/api/auth/google/callback",
					maxAge: 900,
					secure: process.env.NODE_ENV === "production",
				});
			}
		} catch {
			// Ignoruj, jeśli URL w mockach testowych jest niestandardowy
		}

		return res;
	} catch (err: unknown) {
		console.error("Błąd inicjalizacji Google OAuth:", err);
		return NextResponse.json(
			{ error: "Błąd serwera podczas inicjalizacji Google OAuth." },
			{ status: 500 },
		);
	}
}
