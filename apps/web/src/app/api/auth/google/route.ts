import { compare } from "@node-rs/bcrypt";
import { db, galleries } from "@wedding-drop/db";
import { getGoogleAuthUrl, isGoogleDriveConfigured } from "@wedding-drop/media";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { verifyOwnerToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

		const { searchParams } = new URL(req.url);
		const slug = searchParams.get("slug");
		const token = searchParams.get("token");
		const password = searchParams.get("password");

		if (!slug || (!token && !password)) {
			return NextResponse.json(
				{
					error: "Wymagany jest slug galerii oraz token lub hasło właściciela.",
				},
				{ status: 400 },
			);
		}

		// Weryfikacja tożsamości właściciela galerii
		if (token && !verifyOwnerToken(token, slug)) {
			return NextResponse.json(
				{ error: "Nieprawidłowy token właściciela galerii." },
				{ status: 401 },
			);
		}

		if (!token && password) {
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

			const gallery = galleryResult[0];
			const isValid = await compare(password, gallery.ownerPasswordHash);
			if (!isValid) {
				return NextResponse.json(
					{ error: "Nieprawidłowe hasło właściciela galerii." },
					{ status: 401 },
				);
			}
		}

		// Generujemy bezpieczny URL Google OAuth ze stanem HMAC
		const authUrl = getGoogleAuthUrl(slug);

		return NextResponse.redirect(authUrl);
	} catch (err: unknown) {
		console.error("Błąd inicjalizacji Google OAuth:", err);
		const errorMsg =
			err instanceof Error
				? err.message
				: "Błąd serwera podczas inicjalizacji Google OAuth.";
		return NextResponse.json({ error: errorMsg }, { status: 500 });
	}
}
