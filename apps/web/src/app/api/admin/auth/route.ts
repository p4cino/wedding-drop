import { compare } from "@node-rs/bcrypt";
import { adminLoginDto, admins, db } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { generateAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
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

		if (!adminResult.length) {
			return NextResponse.json(
				{ error: "Błędne dane logowania" },
				{ status: 401 },
			);
		}

		const isValid = await compare(password, adminResult[0].passwordHash);
		if (!isValid) {
			return NextResponse.json({ error: "Błędne hasło" }, { status: 401 });
		}

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
