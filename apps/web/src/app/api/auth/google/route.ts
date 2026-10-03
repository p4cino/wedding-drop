import { compare } from "@node-rs/bcrypt";
import { db, galleries } from "@wedding-drop/db";
import { getGoogleAuthUrl, isGoogleDriveConfigured } from "@wedding-drop/media";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { verifyOwnerToken } from "@/lib/auth";

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
			const isValid = await compare(password, gallery.ownerPasswordHash);
			if (!isValid) {
				return NextResponse.json(
					{ error: "Nieprawidłowe hasło właściciela galerii." },
					{ status: 401 },
				);
			}
		}

		const authUrl = getGoogleAuthUrl(slug);
		return NextResponse.json({ authUrl }, { status: 200 });
	} catch (err: unknown) {
		console.error("Błąd inicjalizacji Google OAuth:", err);
		const errorMsg =
			err instanceof Error
				? err.message
				: "Błąd serwera podczas inicjalizacji Google OAuth.";
		return NextResponse.json({ error: errorMsg }, { status: 500 });
	}
}
