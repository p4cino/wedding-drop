import { db, galleries } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { generateGuestToken, setGuestSessionCookie } from "@/lib/auth";
import { hashGuestPassword, verifyGuestPassword } from "@/lib/guest-password";

export async function POST(
	req: NextRequest,
	props: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await props.params;
		const body = await req.json();
		const password = body.password;

		if (!password) {
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

		const { valid: isValid, needsRehash } = verifyGuestPassword(
			String(password),
			gallery.guestPassword,
		);

		if (!isValid) {
			return NextResponse.json(
				{ error: "Nieprawidłowe hasło" },
				{ status: 401 },
			);
		}

		if (needsRehash) {
			await db
				.update(galleries)
				.set({ guestPassword: hashGuestPassword(String(password)) })
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
