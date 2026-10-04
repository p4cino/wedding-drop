import { compare } from "@node-rs/bcrypt";
import { db, galleries, mediaItems } from "@wedding-drop/db";
import { and, desc, eq, ne } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { readOwnerToken, verifyAdminToken, verifyOwnerToken } from "@/lib/auth";

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
		const includeHidden = searchParams.get("includeHidden") === "true";

		let canViewHidden = false;
		if (includeHidden) {
			const ownerToken = readOwnerToken(req, slug);
			if (ownerToken && verifyOwnerToken(ownerToken, slug)) {
				canViewHidden = true;
			}
			const ownerPassword = req.headers.get("x-owner-password");
			if (
				!canViewHidden &&
				ownerPassword &&
				(await compare(ownerPassword, gallery.ownerPasswordHash))
			) {
				canViewHidden = true;
			}
			const authHeader = req.headers.get("authorization");
			const bearerToken =
				authHeader && /^Bearer\s+/i.test(authHeader)
					? authHeader.replace(/^Bearer\s+/i, "")
					: null;
			const adminToken = req.headers.get("x-admin-token") || bearerToken;
			if (!canViewHidden && adminToken && verifyAdminToken(adminToken)) {
				canViewHidden = true;
			}

			if (!canViewHidden) {
				return NextResponse.json(
					{ error: "Brak uprawnień do przeglądania ukrytych materiałów" },
					{ status: 401 },
				);
			}
		}

		if (!gallery.allowGuestViewing && !canViewHidden) {
			// Goście nie mogą przeglądać zdjęć, jeśli allowGuestViewing === false
			return NextResponse.json({ media: [] });
		}

		const condition = canViewHidden
			? and(
					eq(mediaItems.galleryId, gallery.id),
					ne(mediaItems.status, "deleted"),
				)
			: and(
					eq(mediaItems.galleryId, gallery.id),
					eq(mediaItems.status, "ready"),
				);

		const items = await db
			.select()
			.from(mediaItems)
			.where(condition)
			.orderBy(desc(mediaItems.createdAt));

		const formatted = items.map((m) => ({
			id: m.id,
			uploaderName: m.uploaderName,
			source: m.source,
			fileType: m.fileType,
			mediaType: m.mediaType,
			mimeType: m.mimeType,
			originalFileName: m.originalFileName,
			fileSize: m.fileSize,
			width: m.width,
			height: m.height,
			duration: m.duration,
			status: m.status,
			createdAt: m.createdAt,
			thumbUrl: `/media-file/${m.thumbPath.replace(/\\/g, "/")}`,
			rawUrl: `/media-file/${m.storagePath.replace(/\\/g, "/")}`,
		}));

		return NextResponse.json({ media: formatted });
	} catch (error) {
		console.error("Błąd pobierania mediów:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
