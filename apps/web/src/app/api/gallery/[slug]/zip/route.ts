import path from "node:path";
import { Readable } from "node:stream";
import { compare } from "@node-rs/bcrypt";
import { db, galleries, mediaItems } from "@wedding-drop/db";
import { createGalleryZipStream } from "@wedding-drop/media";
import { and, eq, ne } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
		const galleryResult = await db
			.select()
			.from(galleries)
			.where(eq(galleries.slug, slug))
			.limit(1);

		if (!galleryResult.length) {
			return NextResponse.json(
				{ error: "Galeria nie istnieje" },
				{ status: 404 },
			);
		}

		const gallery = galleryResult[0];
		const { searchParams } = new URL(req.url);
		const providedPassword =
			req.headers.get("x-owner-password") || searchParams.get("password");
		let isOwner = false;

		if (providedPassword) {
			isOwner = await compare(providedPassword, gallery.ownerPasswordHash);
		}

		// Jeśli to nie jest właściciel, sprawdzamy uprawnienia gościa
		if (!isOwner) {
			if (!gallery.allowGuestDownloads) {
				return NextResponse.json(
					{ error: "Pobieranie plików zostało wyłączone przez Parę Młodą" },
					{ status: 403 },
				);
			}
			if (gallery.accessPin) {
				const pin = req.headers.get("x-access-pin") || searchParams.get("pin");
				if (pin !== gallery.accessPin) {
					return NextResponse.json(
						{ error: "Wymagany prawidłowy kod PIN galerii" },
						{ status: 401 },
					);
				}
			}
		}

		// Właściciel pobiera zdjęcia gotowe oraz ukryte (zgodnie z obietnicą w UI)
		const statusCondition = isOwner
			? and(
					eq(mediaItems.galleryId, gallery.id),
					ne(mediaItems.status, "deleted"),
				)
			: and(
					eq(mediaItems.galleryId, gallery.id),
					eq(mediaItems.status, "ready"),
				);

		const items = await db.select().from(mediaItems).where(statusCondition);

		if (items.length === 0) {
			return NextResponse.json(
				{ error: "Brak zdjęć do pobrania w tej galerii" },
				{ status: 400 },
			);
		}

		const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");

		const { stream: passThrough, addedCount } = createGalleryZipStream(
			items,
			dataDir,
		);

		if (addedCount === 0) {
			return NextResponse.json(
				{ error: "Pliki fizyczne nie zostały znalezione na dysku" },
				{ status: 404 },
			);
		}

		// Konwersja Node Stream do standardowego Web Stream
		const webStream = Readable.toWeb(passThrough);

		const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "");
		const dateStr = new Date().toISOString().slice(0, 10);
		const filename = `galeria-${safeSlug}-${dateStr}.zip`;

		return new Response(webStream as unknown as BodyInit, {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="${filename}"`,
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		console.error("Błąd generowania ZIP:", error);
		return NextResponse.json(
			{ error: "Błąd serwera podczas strumieniowania ZIP" },
			{ status: 500 },
		);
	}
}
