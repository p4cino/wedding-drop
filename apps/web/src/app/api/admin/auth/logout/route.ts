import { type NextRequest, NextResponse } from "next/server";
import { revokeToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	const token =
		req.headers.get("x-admin-token") ||
		req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
		null;
	if (!token || !revokeToken(token)) {
		return NextResponse.json(
			{ error: "Brak uprawnień administratora" },
			{ status: 401 },
		);
	}
	return NextResponse.json({ success: true });
}
