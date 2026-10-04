import crypto from "node:crypto";
import { compare } from "@node-rs/bcrypt";
import { db, galleries } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import type { NextRequest, NextResponse } from "next/server";
import {
	AUTH_FAILURE_LIMIT,
	getClientIp,
	peekRateLimit,
	recordRateLimitHit,
} from "./rate-limit";

export const OWNER_SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 604800s (7 dni)

export function ownerSessionCookieName(slug: string): string {
	return `wd_owner_${slug}`;
}

export function setOwnerSessionCookie(
	res: NextResponse,
	slug: string,
	token: string,
): void {
	res.cookies.set({
		name: ownerSessionCookieName(slug),
		value: token,
		httpOnly: true,
		sameSite: "strict",
		path: "/api",
		maxAge: OWNER_SESSION_MAX_AGE,
		secure: process.env.NODE_ENV === "production",
	});
}

export function guestSessionCookieName(slug: string): string {
	return `wd_guest_${slug}`;
}

export function setGuestSessionCookie(
	res: NextResponse,
	slug: string,
	token: string,
): void {
	res.cookies.set({
		name: guestSessionCookieName(slug),
		value: token,
		httpOnly: true,
		sameSite: "strict",
		path: "/",
		maxAge: OWNER_SESSION_MAX_AGE,
		secure: process.env.NODE_ENV === "production",
	});
}

export function clearOwnerSessionCookie(res: NextResponse, slug: string): void {
	res.cookies.set({
		name: ownerSessionCookieName(slug),
		value: "",
		httpOnly: true,
		sameSite: "strict",
		path: "/api",
		maxAge: 0,
		secure: process.env.NODE_ENV === "production",
	});
}

function getCookieValue(
	req: NextRequest | Request,
	name: string,
): string | undefined {
	if ("cookies" in req && typeof req.cookies?.get === "function") {
		return req.cookies.get(name)?.value;
	}
	const cookieHeader = req.headers.get("cookie");
	if (!cookieHeader) return undefined;
	const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : undefined;
}

export function readOwnerToken(
	req: NextRequest | Request,
	slug: string,
	body?: { token?: string } | null,
): string | null {
	const headerToken = req.headers.get("x-owner-token");
	if (headerToken) return headerToken;

	const authHeader = req.headers.get("authorization");
	if (authHeader && /^Bearer\s+/i.test(authHeader)) {
		return authHeader.replace(/^Bearer\s+/i, "");
	}

	if (body?.token) {
		return body.token;
	}

	const method = req.method?.toUpperCase();
	if (method === "GET" || method === "HEAD") {
		const cookieToken = getCookieValue(req, ownerSessionCookieName(slug));
		if (cookieToken) return cookieToken;
	}

	return null;
}

export function readGuestToken(
	req: NextRequest | Request,
	slug: string,
): string | null {
	const cookieToken = getCookieValue(req, guestSessionCookieName(slug));
	if (cookieToken) return cookieToken;
	return null;
}

let runtimeFallbackSecret: string | null = null;

function getRuntimeFallbackSecret(): string {
	if (!runtimeFallbackSecret) {
		runtimeFallbackSecret = crypto.randomBytes(32).toString("hex");
	}
	return runtimeFallbackSecret;
}

export function getAdminSecret(): string {
	return process.env.ADMIN_SECRET || getRuntimeFallbackSecret();
}

export function getOwnerSecret(): string {
	return (
		process.env.OWNER_SECRET ||
		process.env.ADMIN_SECRET ||
		getRuntimeFallbackSecret()
	);
}

const ADMIN_TOKEN_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 godzin
const OWNER_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dni
const MAX_REVOKED_TOKENS = 10_000;

/** Lista unieważnionych `jti` (in-memory) wraz z czasem wygaśnięcia tokenu. */
const revokedJtis = new Map<string, number>();

function pruneRevoked(now: number): void {
	for (const [jti, expiresAt] of revokedJtis) {
		if (expiresAt <= now) revokedJtis.delete(jti);
	}
	// Twarda granica pamięci - najstarsze wpisy (kolejność wstawiania) wypadają pierwsze
	while (revokedJtis.size > MAX_REVOKED_TOKENS) {
		const oldest = revokedJtis.keys().next().value;
		if (oldest === undefined) break;
		revokedJtis.delete(oldest);
	}
}

function signRoleToken(
	role: "admin" | "owner",
	secret: string,
	subject: string,
): string {
	const timestamp = Date.now();
	const jti = crypto.randomBytes(16).toString("hex");
	const payload = `${role}:${timestamp}.${jti}.${subject}`;
	const hmac = crypto
		.createHmac("sha256", secret)
		.update(payload)
		.digest("hex");
	return `${role}_${timestamp}_${jti}_${Buffer.from(subject).toString("base64")}_${hmac}`;
}

interface ParsedRoleToken {
	timestamp: number;
	jti: string;
	subject: string;
}

/**
 * Weryfikuje podpis, wiek i listę unieważnień tokenu roli.
 * Tokeny w starym formacie (bez `jti`, 4 segmenty) są odrzucane.
 */
function parseRoleToken(
	token: string | null | undefined,
	role: "admin" | "owner",
	secret: string,
	maxAgeMs: number,
): ParsedRoleToken | null {
	if (!token?.startsWith(`${role}_`)) return null;
	const parts = token.split("_");
	if (parts.length !== 5) return null;
	const timestamp = parseInt(parts[1], 10);
	const jti = parts[2];
	const subject = Buffer.from(parts[3], "base64").toString("utf-8");
	const providedHmac = parts[4];

	if (!/^[0-9a-f]{32}$/.test(jti) || !/^[0-9a-f]{64}$/.test(providedHmac)) {
		return null;
	}
	const now = Date.now();
	if (
		Number.isNaN(timestamp) ||
		now - timestamp > maxAgeMs ||
		timestamp > now + 60000
	) {
		return null;
	}

	const payload = `${role}:${timestamp}.${jti}.${subject}`;
	const expectedHmac = crypto
		.createHmac("sha256", secret)
		.update(payload)
		.digest("hex");

	try {
		const providedBuf = Buffer.from(providedHmac, "hex");
		const expectedBuf = Buffer.from(expectedHmac, "hex");
		if (providedBuf.length !== expectedBuf.length) return null;
		if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null;
	} catch {
		return null;
	}

	if (revokedJtis.has(jti)) return null;
	return { timestamp, jti, subject };
}

export function generateAdminToken(username: string): string {
	return signRoleToken("admin", getAdminSecret(), username);
}

export function verifyAdminToken(token: string | null | undefined): boolean {
	return (
		parseRoleToken(token, "admin", getAdminSecret(), ADMIN_TOKEN_MAX_AGE_MS) !==
		null
	);
}

export function generateOwnerToken(slug: string): string {
	return signRoleToken("owner", getOwnerSecret(), slug);
}

export function verifyOwnerToken(
	token: string | null | undefined,
	expectedSlug: string,
): boolean {
	const parsed = parseRoleToken(
		token,
		"owner",
		getOwnerSecret(),
		OWNER_TOKEN_MAX_AGE_MS,
	);
	return parsed !== null && parsed.subject === expectedSlug;
}

/**
 * Unieważnia poprawnie podpisany token administratora lub właściciela do czasu jego wygaśnięcia.
 * Zwraca false, gdy token jest niepoprawny (nie ma czego unieważniać).
 */
export function revokeToken(token: string | null | undefined): boolean {
	const admin = parseRoleToken(
		token,
		"admin",
		getAdminSecret(),
		ADMIN_TOKEN_MAX_AGE_MS,
	);
	const owner = admin
		? null
		: parseRoleToken(token, "owner", getOwnerSecret(), OWNER_TOKEN_MAX_AGE_MS);
	const parsed = admin ?? owner;
	if (!parsed) return false;
	const maxAge = admin ? ADMIN_TOKEN_MAX_AGE_MS : OWNER_TOKEN_MAX_AGE_MS;
	pruneRevoked(Date.now());
	revokedJtis.set(parsed.jti, parsed.timestamp + maxAge);
	return true;
}

/** Tylko do testów. */
export function _resetRevokedTokensForTests(): void {
	revokedJtis.clear();
}

export function generateGuestToken(slug: string): string {
	const timestamp = Date.now();
	const payload = `guest:${timestamp}.${slug}`;
	const hmac = crypto
		.createHmac("sha256", getOwnerSecret())
		.update(payload)
		.digest("hex");
	return `guest_${timestamp}_${Buffer.from(slug).toString("base64")}_${hmac}`;
}

export function verifyGuestToken(
	token: string | null | undefined,
	expectedSlug: string,
): boolean {
	if (!token?.startsWith("guest_")) return false;
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

	if (!/^[0-9a-f]{64}$/.test(providedHmac)) return false;

	const payload = `guest:${timestamp}.${slug}`;
	const expectedHmac = crypto
		.createHmac("sha256", getOwnerSecret())
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

function readAdminTokenFromRequest(req: NextRequest | Request): string | null {
	const header = req.headers.get("x-admin-token");
	if (header) return header;
	const authHeader = req.headers.get("authorization");
	if (authHeader && /^Bearer\s+/i.test(authHeader)) {
		return authHeader.replace(/^Bearer\s+/i, "");
	}
	return null;
}

/**
 * Czy żądanie niesie ważny token właściciela tej galerii lub administratora
 * (bez kosztownej weryfikacji hasła - tylko HMAC).
 */
export function hasPrivilegedToken(
	req: NextRequest | Request,
	slug: string,
): boolean {
	const ownerToken = readOwnerToken(req, slug);
	if (ownerToken && verifyOwnerToken(ownerToken, slug)) return true;
	const adminToken = readAdminTokenFromRequest(req);
	return !!adminToken && verifyAdminToken(adminToken);
}

/**
 * Uprawnienie do ukrytych materiałów: token właściciela/administratora lub nagłówek `x-owner-password`.
 * Weryfikacja hasła (bcrypt) jest poprzedzona limiterem prób - po jego przekroczeniu zwracamy
 * `retryAfter` i NIE wykonujemy bcrypt.
 */
export async function authorizeHiddenAccess(
	req: NextRequest | Request,
	slug: string,
	ownerPasswordHash: string,
): Promise<{ granted: boolean; retryAfter?: number }> {
	if (hasPrivilegedToken(req, slug)) return { granted: true };

	const ownerPassword = req.headers.get("x-owner-password");
	if (!ownerPassword) return { granted: false };

	const key = `${getClientIp(req.headers)}:${slug}`;
	const limit = peekRateLimit("owner-password", key, AUTH_FAILURE_LIMIT);
	if (!limit.ok) return { granted: false, retryAfter: limit.retryAfter };

	let valid = false;
	try {
		valid = await compare(ownerPassword, ownerPasswordHash);
	} catch {
		valid = false;
	}
	if (valid) return { granted: true };

	const after = recordRateLimitHit("owner-password", key, AUTH_FAILURE_LIMIT);
	return after.ok
		? { granted: false }
		: { granted: false, retryAfter: after.retryAfter };
}

/**
 * Czy żądanie ma dostęp do galerii chronionej hasłem gościa: galeria bez hasła,
 * ważne ciasteczko sesji gościa albo token właściciela/administratora.
 */
export function hasGuestAccess(
	req: NextRequest | Request,
	slug: string,
	guestPassword: string | null | undefined,
): boolean {
	if (!guestPassword) return true;
	if (verifyGuestToken(readGuestToken(req, slug), slug)) return true;
	return hasPrivilegedToken(req, slug);
}

/** Wariant dla surowego nagłówka `Cookie` (TUS działa poza Next.js). */
export function verifyGuestCookieHeader(
	slug: string,
	cookieHeader: string | undefined,
): boolean {
	if (!cookieHeader) return false;
	const match = cookieHeader.match(
		new RegExp(`(?:^|;\\s*)${guestSessionCookieName(slug)}=([^;]*)`),
	);
	if (!match) return false;
	try {
		return verifyGuestToken(decodeURIComponent(match[1]), slug);
	} catch {
		return false;
	}
}

/**
 * Adapter wstrzykiwany do `initTusServer` (packages/media/src/tus-server.ts) w `apps/web/server.ts`,
 * reużywający istniejący `verifyOwnerToken` bez przenoszenia logiki HMAC poza `apps/web`
 * i bez odwracania kierunku zależności monorepo (packages/media nigdy nie importuje z apps/web).
 */
export function verifyOwnerCredentialsForTus(
	gallerySlug: string,
	ownerToken: string | undefined,
): boolean {
	return verifyOwnerToken(ownerToken, gallerySlug);
}

export async function authenticateOwner(
	req: NextRequest,
	slug: string,
	body?: { token?: string } | null,
): Promise<{
	authorized: boolean;
	gallery?: typeof galleries.$inferSelect;
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
	const token = readOwnerToken(req, slug, body);

	if (token && verifyOwnerToken(token, slug)) {
		return { authorized: true, gallery };
	}

	return {
		authorized: false,
		errorStatus: 401,
		errorMessage: "Brak autoryzacji",
	};
}
