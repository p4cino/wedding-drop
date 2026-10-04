import crypto from "node:crypto";
import { db, galleries } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { generateGuestToken, setGuestSessionCookie } from "@/lib/auth";

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

		// Bezpieczne porównanie hasła (używamy timingSafeEqual dla bezpieczeństwa)
		const providedBuf = Buffer.from(password, "utf-8");
		const expectedBuf = Buffer.from(gallery.guestPassword, "utf-8");

		// Aby zapobiec atakom polegającym na wykrywaniu długości, zawsze haszujemy najpierw
		// lub dopełniamy do stałej długości. Dla uproszczenia (bo hasło nie jest zahashowane w DB
		// lub nie wiemy, zrobimy najpierw hash z obu stron by mieć stałą długość przed porównaniem).
		const providedHash = crypto
			.createHash("sha256")
			.update(providedBuf)
			.digest();
		const expectedHash = crypto
			.createHash("sha256")
			.update(expectedBuf)
			.digest();

		const isValid = crypto.timingSafeEqual(providedHash, expectedHash);

		if (!isValid) {
			return NextResponse.json(
				{ error: "Nieprawidłowe hasło" },
				{ status: 401 },
			);
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
