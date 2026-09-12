import { admins, db } from "@wedding-drop/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { generateAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { username, password } = body;

		const user = username || "admin";
		const adminResult = await db
			.select()
			.from(admins)
			.where(eq(admins.username, user))
			.limit(1);

		if (!adminResult.length) {
			return NextResponse.json(
				{ error: "Błędne dane logowania" },
				{ status: 401 },
			);
		}

		const isValid = await bcrypt.compare(password, adminResult[0].passwordHash);
		if (!isValid) {
			return NextResponse.json({ error: "Błędne hasło" }, { status: 401 });
		}

		// Bezpieczny, kryptograficznie podpisany token HMAC
		return NextResponse.json({
			success: true,
			adminToken: generateAdminToken(user),
		});
	} catch (error) {
		console.error("Błąd w endpoint admin auth:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
