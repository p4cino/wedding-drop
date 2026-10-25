import crypto from "node:crypto";
import { db, galleries, galleryGdriveExports } from "@wedding-drop/db";
import { exchangeCodeForTokens, verifySignedState } from "@wedding-drop/media";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const error = searchParams.get("error");

	const baseUrl = (process.env.APP_DOMAIN || "http://localhost:3000").replace(
		/\/$/,
		"",
	);

	// 1. Użytkownik anulował logowanie w Google
	if (error) {
		console.warn("Użytkownik anulował autoryzację Google:", error);
		return NextResponse.redirect(
			`${baseUrl}/?gdrive_error=${encodeURIComponent(error)}`,
		);
	}

	// 2. Weryfikacja integralności i podpisu HMAC stanu 'state'
	if (!state || !code) {
		return NextResponse.redirect(`${baseUrl}/?gdrive_error=missing_parameters`);
	}

	// Jeśli przeglądarka posiada ciasteczko wiążące sesję OAuth (wd_gdrive_oauth_state),
	// weryfikujemy zgodność skrótu SHA-256 (ochrona przed Login/Account Planting CSRF F-07)
	const stateBindingCookie = req.cookies?.get?.("wd_gdrive_oauth_state")?.value;
	if (stateBindingCookie) {
		const expectedDigest = crypto
			.createHash("sha256")
			.update(state)
			.digest("hex");
		const cookieBuf = Buffer.from(stateBindingCookie, "hex");
		const expectedBuf = Buffer.from(expectedDigest, "hex");
		if (
			cookieBuf.length !== expectedBuf.length ||
			!crypto.timingSafeEqual(cookieBuf, expectedBuf)
		) {
			return NextResponse.redirect(
				`${baseUrl}/?gdrive_error=invalid_or_expired_state`,
			);
		}
	}

	const verified = verifySignedState(state);
	if (!verified?.slug) {
		return NextResponse.redirect(
			`${baseUrl}/?gdrive_error=invalid_or_expired_state`,
		);
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
			.select({ gallery: galleries, gdrive: galleryGdriveExports })
			.from(galleries)
			.leftJoin(
				galleryGdriveExports,
				eq(galleries.id, galleryGdriveExports.galleryId),
			)
			.where(eq(galleries.slug, slug))
			.limit(1);

		if (!galleryResult.length) {
			return NextResponse.redirect(
				`${ownerDashboardUrl}?gdrive_error=gallery_not_found`,
			);
		}

		const { gallery: currentGallery, gdrive: currentGDrive } = galleryResult[0];
		const refreshTokenToSave =
			tokens.refresh_token || currentGDrive?.refreshToken;

		if (currentGDrive) {
			await db
				.update(galleryGdriveExports)
				.set({
					refreshToken: refreshTokenToSave,
					accountEmail: email || currentGDrive.accountEmail,
					exportStatus:
						currentGDrive.exportStatus === "running" ? "running" : "idle",
				})
				.where(eq(galleryGdriveExports.galleryId, currentGallery.id));
		} else {
			await db.insert(galleryGdriveExports).values({
				galleryId: currentGallery.id,
				refreshToken: refreshTokenToSave || "",
				accountEmail: email || null,
				exportStatus: "idle",
			});
		}

		const redirectRes = NextResponse.redirect(
			`${ownerDashboardUrl}?gdrive=connected`,
		);
		redirectRes.cookies.set({
			name: "wd_gdrive_oauth_state",
			value: "",
			httpOnly: true,
			sameSite: "lax",
			path: "/api/auth/google/callback",
			maxAge: 0,
			secure: process.env.NODE_ENV === "production",
		});
		return redirectRes;
	} catch (err: unknown) {
		console.error("Błąd podczas przetwarzania callbacku Google OAuth:", err);
		const errorMessage = err instanceof Error ? err.message : "auth_failed";
		return NextResponse.redirect(
			`${ownerDashboardUrl}?gdrive_error=${encodeURIComponent(errorMessage)}`,
		);
	}
}
