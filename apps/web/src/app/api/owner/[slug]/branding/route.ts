import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { db, galleryBranding } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateOwner } from "@/lib/auth";

const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/svg+xml",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug: rawSlug } = await params;
		const slug = rawSlug.toLowerCase().replace(/[^a-z0-9_-]/g, "");

		const auth = await authenticateOwner(req, slug);
		if (!auth.authorized || !auth.gallery) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const formData = await req.formData();
		const logo = formData.get("logo") as File | null;
		const background = formData.get("background") as File | null;

		if (!logo && !background) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
		const safeDataDir = path.resolve(/* turbopackIgnore: true */ dataDir);
		const brandingDir = path.join(safeDataDir, "galleries", slug, "branding");
		const safeBrandingDir = path.resolve(
			/* turbopackIgnore: true */ brandingDir,
		);
		if (!safeBrandingDir.startsWith(safeDataDir)) {
			return NextResponse.json({ error: "Invalid path" }, { status: 403 });
		}

		await mkdir(brandingDir, { recursive: true });

		let logoPath: string | undefined;
		let backgroundPath: string | undefined;

		if (logo) {
			if (!ALLOWED_MIME_TYPES.includes(logo.type)) {
				return NextResponse.json(
					{ error: "Invalid logo file type" },
					{ status: 400 },
				);
			}
			if (logo.size > MAX_FILE_SIZE) {
				return NextResponse.json(
					{ error: "Logo file too large" },
					{ status: 400 },
				);
			}

			const ext = logo.name.split(".").pop() || "png";
			const fileName = `logo.${ext}`;
			const fullPath = path.join(brandingDir, fileName);
			const buffer = Buffer.from(await logo.arrayBuffer());
			await writeFile(fullPath, buffer);
			logoPath = path.posix.join(
				"/data",
				"galleries",
				slug,
				"branding",
				fileName,
			);
		}

		if (background) {
			if (!ALLOWED_MIME_TYPES.includes(background.type)) {
				return NextResponse.json(
					{ error: "Invalid background file type" },
					{ status: 400 },
				);
			}
			if (background.size > MAX_FILE_SIZE) {
				return NextResponse.json(
					{ error: "Background file too large" },
					{ status: 400 },
				);
			}

			const ext = background.name.split(".").pop() || "png";
			const fileName = `background.${ext}`;
			const fullPath = path.join(brandingDir, fileName);
			const buffer = Buffer.from(await background.arrayBuffer());
			await writeFile(fullPath, buffer);
			backgroundPath = path.posix.join(
				"/data",
				"galleries",
				slug,
				"branding",
				fileName,
			);
		}

		const existing = await db.query.galleryBranding.findFirst({
			where: eq(galleryBranding.galleryId, auth.gallery.id),
		});

		if (existing) {
			await db
				.update(galleryBranding)
				.set({
					logoPath: logoPath ?? existing.logoPath,
					backgroundPath: backgroundPath ?? existing.backgroundPath,
					updatedAt: new Date(),
				})
				.where(eq(galleryBranding.galleryId, auth.gallery.id));
		} else {
			await db.insert(galleryBranding).values({
				galleryId: auth.gallery.id,
				logoPath,
				backgroundPath,
			});
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error uploading branding:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug: rawSlug } = await params;
		const slug = rawSlug.toLowerCase().replace(/[^a-z0-9_-]/g, "");

		const auth = await authenticateOwner(req, slug);
		if (!auth.authorized || !auth.gallery) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		const schema = z.object({
			type: z.enum(["logo", "background"]),
		});
		const parsed = schema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid request" }, { status: 400 });
		}

		const existing = await db.query.galleryBranding.findFirst({
			where: eq(galleryBranding.galleryId, auth.gallery.id),
		});

		if (existing) {
			const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
			const brandingDir = path.join(dataDir, "galleries", slug, "branding");

			if (parsed.data.type === "logo" && existing.logoPath) {
				const ext = existing.logoPath.split(".").pop();
				const fileName = `logo.${ext}`;
				const fullPath = path.join(brandingDir, fileName);
				try {
					await unlink(fullPath);
				} catch (e) {
					// Zignoruj jeśli plik nie istnieje
				}
				await db
					.update(galleryBranding)
					.set({
						logoPath: null,
						updatedAt: new Date(),
					})
					.where(eq(galleryBranding.galleryId, auth.gallery.id));
			}

			if (parsed.data.type === "background" && existing.backgroundPath) {
				const ext = existing.backgroundPath.split(".").pop();
				const fileName = `background.${ext}`;
				const fullPath = path.join(brandingDir, fileName);
				try {
					await unlink(fullPath);
				} catch (e) {
					// Zignoruj jeśli plik nie istnieje
				}
				await db
					.update(galleryBranding)
					.set({
						backgroundPath: null,
						updatedAt: new Date(),
					})
					.where(eq(galleryBranding.galleryId, auth.gallery.id));
			}
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting branding:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
