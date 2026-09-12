import fs from "node:fs/promises";
import path from "node:path";
import { cardSettings, db, galleries, mediaItems } from "@wedding-drop/db";
import bcrypt from "bcryptjs";
import { desc, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getAdminTokenFromRequest(
	req: NextRequest,
	body?: { token?: string } | null,
): string | null {
	return (
		req.headers.get("x-admin-token") ||
		req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
		new URL(req.url).searchParams.get("token") ||
		body?.token ||
		null
	);
}

export async function GET(req: NextRequest) {
	try {
		const token = getAdminTokenFromRequest(req);
		if (!verifyAdminToken(token)) {
			return NextResponse.json(
				{ error: "Brak uprawnień administratora" },
				{ status: 401 },
			);
		}

		const allGalleries = await db
			.select({
				id: galleries.id,
				slug: galleries.slug,
				coupleNames: galleries.coupleNames,
				weddingDate: galleries.weddingDate,
				ownerEmail: galleries.ownerEmail,
				isActive: galleries.isActive,
				maxStorageBytes: galleries.maxStorageBytes,
				expiresAt: galleries.expiresAt,
				createdAt: galleries.createdAt,
				totalFiles: sql<number>`COALESCE(count(${mediaItems.id}), 0)::int`,
				totalBytes: sql<number>`COALESCE(sum(${mediaItems.fileSize}), 0)::bigint`,
			})
			.from(galleries)
			.leftJoin(mediaItems, eq(galleries.id, mediaItems.galleryId))
			.groupBy(galleries.id)
			.orderBy(desc(galleries.createdAt));

		return NextResponse.json({ galleries: allGalleries });
	} catch (error) {
		console.error("Błąd pobierania listy galerii:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const token = getAdminTokenFromRequest(req, body);

		if (!verifyAdminToken(token)) {
			return NextResponse.json(
				{ error: "Brak uprawnień administratora" },
				{ status: 401 },
			);
		}

		const {
			coupleNames,
			weddingDate,
			ownerEmail,
			ownerPassword,
			customSlug,
			accessPin,
			maxStorageGb,
		} = body;

		if (!coupleNames || !weddingDate || !ownerEmail || !ownerPassword) {
			return NextResponse.json(
				{ error: "Wszystkie podstawowe pola są wymagane" },
				{ status: 400 },
			);
		}

		// Bezpieczne generowanie i sanityzacja sluga
		let slug = customSlug
			?.trim()
			?.toLowerCase()
			?.replace(/[^a-z0-9_-]/g, "");
		if (!slug) {
			const normalized = coupleNames
				.toLowerCase()
				.replace(/[ąćęłńóśźż]/g, (c: string) => {
					const map: Record<string, string> = {
						ą: "a",
						ć: "c",
						ę: "e",
						ł: "l",
						ń: "n",
						ó: "o",
						ś: "s",
						ź: "z",
						ż: "z",
					};
					return map[c] || c;
				})
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "");
			const year = weddingDate.slice(0, 4) || String(new Date().getFullYear());
			slug = `${normalized}-${year}`;
		}

		// Sprawdzenie unikalności sluga
		const existingSlug = await db
			.select()
			.from(galleries)
			.where(eq(galleries.slug, slug))
			.limit(1);
		if (existingSlug.length) {
			slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
		}

		const ownerPasswordHash = await bcrypt.hash(ownerPassword, 10);
		const maxStorageBytes = maxStorageGb
			? parseInt(maxStorageGb, 10) * 1024 * 1024 * 1024
			: 0;

		const [newGallery] = await db
			.insert(galleries)
			.values({
				slug,
				coupleNames,
				weddingDate,
				ownerEmail,
				ownerPasswordHash,
				accessPin: accessPin || null,
				maxStorageBytes,
			})
			.returning();

		// Utworzenie domyślnych ustawień karteczki do druku
		await db.insert(cardSettings).values({
			galleryId: newGallery.id,
			headline: "Podziel się wspomnieniami!",
			subheadline:
				"Zeskanuj kod QR aparatem w telefonie i dodaj swoje zdjęcia z naszego wesela",
			primaryColor: "#1E293B",
			accentColor: "#D4AF37",
			paperSize: "A6",
		});

		// Utworzenie folderu na dysku
		const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
		await fs.mkdir(path.join(dataDir, "galleries", slug, "raw"), {
			recursive: true,
		});
		await fs.mkdir(path.join(dataDir, "galleries", slug, "thumbs"), {
			recursive: true,
		});

		return NextResponse.json(
			{ success: true, gallery: newGallery },
			{ status: 201 },
		);
	} catch (error) {
		console.error("Błąd tworzenia galerii:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
