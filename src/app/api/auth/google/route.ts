import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { galleries } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  isGoogleDriveConfigured,
  getGoogleAuthUrl,
} from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!isGoogleDriveConfigured()) {
      return NextResponse.json(
        {
          error:
            "Google Drive nie jest skonfigurowany na tym serwerze. Administrator musi ustawić GOOGLE_CLIENT_ID oraz GOOGLE_CLIENT_SECRET.",
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const password = searchParams.get("password");

    if (!slug || !password) {
      return NextResponse.json(
        { error: "Wymagany jest slug galerii oraz hasło właściciela." },
        { status: 400 }
      );
    }

    // Weryfikacja tożsamości właściciela galerii
    const galleryResult = await db
      .select()
      .from(galleries)
      .where(eq(galleries.slug, slug))
      .limit(1);

    if (!galleryResult.length) {
      return NextResponse.json({ error: "Galeria nie istnieje." }, { status: 404 });
    }

    const gallery = galleryResult[0];
    const isValid = await bcrypt.compare(password, gallery.ownerPasswordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Nieprawidłowe hasło właściciela galerii." }, { status: 401 });
    }

    // Generujemy bezpieczny URL Google OAuth ze stanem HMAC
    const authUrl = getGoogleAuthUrl(slug);

    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error("Błąd inicjalizacji Google OAuth:", err);
    return NextResponse.json(
      { error: err?.message || "Błąd serwera podczas inicjalizacji Google OAuth." },
      { status: 500 }
    );
  }
}
