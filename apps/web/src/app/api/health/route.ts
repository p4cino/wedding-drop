import { client } from "@wedding-drop/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HEALTH_TIMEOUT_MS = 2000;

/**
 * Lekki endpoint gotowości HTTP dla Docker HEALTHCHECK i monitoringu.
 * Weryfikuje łączność z PostgreSQL bez ujawniania szczegółów konfiguracji.
 */
export async function GET() {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		await Promise.race([
			client`SELECT 1`,
			new Promise<never>((_, reject) => {
				timer = setTimeout(
					() => reject(new Error("Healthcheck timeout")),
					HEALTH_TIMEOUT_MS,
				);
			}),
		]);

		return NextResponse.json(
			{ status: "ok" },
			{ status: 200, headers: { "Cache-Control": "no-store" } },
		);
	} catch {
		return NextResponse.json(
			{ status: "error" },
			{ status: 503, headers: { "Cache-Control": "no-store" } },
		);
	} finally {
		if (timer) clearTimeout(timer);
	}
}
