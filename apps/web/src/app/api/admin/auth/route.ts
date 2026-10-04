import { compare } from "@node-rs/bcrypt";
import { adminLoginDto, admins, db } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { generateAdminToken } from "@/lib/auth";
import {
	AUTH_FAILURE_LIMIT,
	getClientIp,
	peekRateLimit,
	recordRateLimitHit,
	resetRateLimit,
	tooManyRequests,
} from "@/lib/rate-limit";

// Stały hash do wyrównania czasu odpowiedzi, gdy użytkownik nie istnieje (brak enumeracji loginów)
const DUMMY_HASH =
	"$2b$10$zE8P/DPStHeBbUkX/p/ocOwT31towpk/fXo80Zds1KZiLrqPDSQDe";
const LOGIN_FAILED = "Błędne dane logowania";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
		const limitKey = `${getClientIp(req.headers)}:admin`;
		const limit = peekRateLimit("admin-login", limitKey, AUTH_FAILURE_LIMIT);
		if (!limit.ok) return tooManyRequests(limit.retryAfter);

		const body = await req.json();
		const parseResult = adminLoginDto.safeParse(body);
		if (!parseResult.success) {
			return NextResponse.json(
				{
					error:
						parseResult.error.issues[0]?.message || "Błędne dane logowania",
					details: parseResult.error.flatten(),
				},
				{ status: 400 },
			);
		}

		const { username, password } = parseResult.data;
		const adminResult = await db
			.select()
			.from(admins)
			.where(eq(admins.username, username))
			.limit(1);

		const hashToCheck = adminResult[0]?.passwordHash ?? DUMMY_HASH;
		const isValid =
			(await compare(password, hashToCheck).catch(() => false)) &&
			adminResult.length > 0;
		if (!isValid) {
			const after = recordRateLimitHit(
				"admin-login",
				limitKey,
				AUTH_FAILURE_LIMIT,
			);
			if (!after.ok) return tooManyRequests(after.retryAfter);
			return NextResponse.json({ error: LOGIN_FAILED }, { status: 401 });
		}
		resetRateLimit("admin-login", limitKey);

		// Bezpieczny, kryptograficznie podpisany token HMAC
		return NextResponse.json({
			success: true,
			adminToken: generateAdminToken(username),
		});
	} catch (error) {
		console.error("Błąd w endpoint admin auth:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
