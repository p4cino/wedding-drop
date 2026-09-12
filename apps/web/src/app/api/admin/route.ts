import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
	admins,
	cardSettings,
	db,
	galleries,
	mediaItems,
} from "@wedding-drop/db";
import bcrypt from "bcryptjs";
import { desc, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getAdminSecret(): string {
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
		return crypto.timingSafeEqual(
			Buffer.from(providedHmac, "hex"),
			Buffer.from(expectedHmac, "hex"),
		);
	} catch {
		return false;
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { action, username, password, token } = body;

		// 1. Logowanie Administratora
		if (action === "login") {
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

			const isValid = await bcrypt.compare(
				password,
				adminResult[0].passwordHash,
			);
			if (!isValid) {
				return NextResponse.json({ error: "Błędne hasło" }, { status: 401 });
			}

			// Bezpieczny, kryptograficznie podpisany token HMAC
			return NextResponse.json({
				success: true,
				adminToken: generateAdminToken(user),
			});
		}

		// Weryfikacja kryptograficznego tokena HMAC dla pozostałych akcji
		if (!verifyAdminToken(token)) {
			return NextResponse.json(
				{ error: "Brak uprawnień administratora" },
				{ status: 401 },
			);
		}

		// 2. Pobranie listy wszystkich galerii ze statystykami
		if (action === "list-galleries") {
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
		}

		// 3. Utworzenie nowego wesela / galerii
		if (action === "create-gallery") {
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
				const year =
					weddingDate.slice(0, 4) || String(new Date().getFullYear());
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

			return NextResponse.json({ success: true, gallery: newGallery });
		}

		// 4. Usunięcie galerii
		if (action === "delete-gallery") {
			const { galleryId } = body;
			const target = await db
				.select()
				.from(galleries)
				.where(eq(galleries.id, galleryId))
				.limit(1);

			if (target.length) {
				const slug = target[0].slug;
				const dataDir =
					process.env.DATA_DIR || path.join(process.cwd(), "data");

				// Usunięcie z bazy (kaskada usunie wpisy w media_items i card_settings)
				await db.delete(galleries).where(eq(galleries.id, galleryId));

				// Usunięcie plików z dysku
				await fs
					.rm(path.join(dataDir, "galleries", slug), {
						recursive: true,
						force: true,
					})
					.catch(() => {});
			}

			return NextResponse.json({ success: true });
		}

		return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
	} catch (error) {
		console.error("Błąd w endpoint admin:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
