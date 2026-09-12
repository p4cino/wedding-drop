import crypto from "node:crypto";
import { db, galleries } from "@wedding-drop/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

export function getAdminSecret(): string {
	return (
		process.env.ADMIN_SECRET ||
		process.env.ADMIN_PASSWORD ||
		"wedding-admin-secret-fallback-key"
	);
}

export function generateAdminToken(username: string): string {
	const timestamp = Date.now();
	const payload = `${timestamp}.${username}`;
	const hmac = crypto
		.createHmac("sha256", getAdminSecret())
		.update(payload)
		.digest("hex");
	return `admin_${timestamp}_${Buffer.from(username).toString("base64")}_${hmac}`;
}

export function verifyAdminToken(token: string | null | undefined): boolean {
	if (!token?.startsWith("admin_")) return false;
	const parts = token.split("_");
	if (parts.length !== 4) return false;
	const timestamp = parseInt(parts[1], 10);
	const username = Buffer.from(parts[2], "base64").toString("utf-8");
	const providedHmac = parts[3];

	// Token ważny przez 7 dni (zabezpieczenie przed manipulacją czasem)
	const maxAge = 7 * 24 * 60 * 60 * 1000;
	if (
		Number.isNaN(timestamp) ||
		Date.now() - timestamp > maxAge ||
		timestamp > Date.now() + 60000
	) {
		return false;
	}

	const payload = `${timestamp}.${username}`;
	const expectedHmac = crypto
		.createHmac("sha256", getAdminSecret())
		.update(payload)
		.digest("hex");

	try {
		const providedBuf = Buffer.from(providedHmac, "hex");
		const expectedBuf = Buffer.from(expectedHmac, "hex");
		if (providedBuf.length !== expectedBuf.length) return false;
		return crypto.timingSafeEqual(providedBuf, expectedBuf);
	} catch {
		return false;
	}
}

export function generateOwnerToken(slug: string): string {
	const timestamp = Date.now();
	const payload = `${timestamp}.${slug}`;
	const hmac = crypto
		.createHmac("sha256", getAdminSecret())
		.update(payload)
		.digest("hex");
	return `owner_${timestamp}_${Buffer.from(slug).toString("base64")}_${hmac}`;
}

export function verifyOwnerToken(
	token: string | null | undefined,
	expectedSlug: string,
): boolean {
	if (!token?.startsWith("owner_")) return false;
	const parts = token.split("_");
	if (parts.length !== 4) return false;
	const timestamp = parseInt(parts[1], 10);
	const slug = Buffer.from(parts[2], "base64").toString("utf-8");
	const providedHmac = parts[3];

	if (slug !== expectedSlug) return false;

	// Token ważny przez 7 dni
	const maxAge = 7 * 24 * 60 * 60 * 1000;
	if (
		Number.isNaN(timestamp) ||
		Date.now() - timestamp > maxAge ||
		timestamp > Date.now() + 60000
	) {
		return false;
	}

	const payload = `${timestamp}.${slug}`;
	const expectedHmac = crypto
		.createHmac("sha256", getAdminSecret())
		.update(payload)
		.digest("hex");

	try {
		const providedBuf = Buffer.from(providedHmac, "hex");
		const expectedBuf = Buffer.from(expectedHmac, "hex");
		if (providedBuf.length !== expectedBuf.length) return false;
		return crypto.timingSafeEqual(providedBuf, expectedBuf);
	} catch {
		return false;
	}
}

export async function authenticateOwner(
	req: NextRequest,
	slug: string,
	body?: any,
): Promise<{
	authorized: boolean;
	gallery?: any;
	errorStatus?: number;
	errorMessage?: string;
}> {
	const galleryResult = await db
		.select()
		.from(galleries)
		.where(eq(galleries.slug, slug))
		.limit(1);

	if (!galleryResult.length) {
		return {
			authorized: false,
			errorStatus: 404,
			errorMessage: "Galeria nie istnieje",
		};
	}

	const gallery = galleryResult[0];

	// Szybka weryfikacja tokenu HMAC (optymalizacja dla Intel N100)
	const token =
		req.headers.get("x-owner-token") ||
		req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
		new URL(req.url).searchParams.get("token") ||
		body?.token;

	if (token && verifyOwnerToken(token, slug)) {
		return { authorized: true, gallery };
	}

	// Kompatybilność wsteczna: fallback do hasła bcrypt
	const password =
		req.headers.get("x-owner-password") ||
		new URL(req.url).searchParams.get("password") ||
		body?.password;

	if (password && (await bcrypt.compare(password, gallery.ownerPasswordHash))) {
		return { authorized: true, gallery };
	}

	return {
		authorized: false,
		errorStatus: 401,
		errorMessage: "Brak autoryzacji",
	};
}
