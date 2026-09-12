import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { galleries } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  verifySignedState,
  exchangeCodeForTokens,
} from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = (process.env.APP_DOMAIN || "http://localhost:3000").replace(/\/$/, "");

  // 1. Użytkownik anulował logowanie w Google
  if (error) {
    console.warn("Użytkownik anulował autoryzację Google:", error);
    return NextResponse.redirect(`${baseUrl}/?gdrive_error=${encodeURIComponent(error)}`);
  }

  // 2. Weryfikacja integralności i podpisu HMAC stanu 'state'
  if (!state || !code) {
    return NextResponse.redirect(`${baseUrl}/?gdrive_error=missing_parameters`);
  }

  const verified = verifySignedState(state);
  if (!verified || !verified.slug) {
    return NextResponse.redirect(`${baseUrl}/?gdrive_error=invalid_or_expired_state`);
  }

  const slug = verified.slug;
  const ownerDashboardUrl = `${baseUrl}/owner/${slug}`;

  try {
    // 3. Wymiana kodu autoryzacji na tokeny (oraz pobranie e-maila konta Google)
    const { tokens, email } = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      console.warn("Brak refresh_token w odpowiedzi Google OAuth.");
    }

    // 4. Zapisanie tokenów w bazie danych dla tego wesela
    const galleryResult = await db
      .select()
      .from(galleries)
      .where(eq(galleries.slug, slug))
      .limit(1);

    if (!galleryResult.length) {
      return NextResponse.redirect(`${ownerDashboardUrl}?gdrive_error=gallery_not_found`);
    }

    const currentGallery = galleryResult[0];
    const refreshTokenToSave = tokens.refresh_token || currentGallery.gdriveRefreshToken;

    await db
      .update(galleries)
      .set({
        gdriveRefreshToken: refreshTokenToSave,
        gdriveAccountEmail: email || currentGallery.gdriveAccountEmail,
        gdriveExportStatus: currentGallery.gdriveExportStatus === "running" ? "running" : "idle",
      })
      .where(eq(galleries.id, currentGallery.id));

    return NextResponse.redirect(`${ownerDashboardUrl}?gdrive=connected`);
  } catch (err: any) {
    console.error("Błąd podczas przetwarzania callbacku Google OAuth:", err);
    return NextResponse.redirect(
      `${ownerDashboardUrl}?gdrive_error=${encodeURIComponent(err?.message || "auth_failed")}`
    );
  }
}
