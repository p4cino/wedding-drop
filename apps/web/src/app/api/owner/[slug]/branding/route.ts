import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { db, galleryBranding } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateOwner } from "@/lib/auth";
import { detectImageType } from "@/lib/image-type";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
// Rozszerzenia, które mogły zostać zapisane kiedykolwiek (włącznie z dawnym SVG) - do sprzątania
const KNOWN_EXTS = ["jpg", "png", "webp", "svg"];

type BrandingKind = "logo" | "background";

/**
 * Waliduje plik po zawartości (magic bytes) i zapisuje go pod nazwą wygenerowaną przez serwer.
 * Nazwa klienta i deklarowany MIME nie biorą udziału w ścieżce zapisu.
 */
async function saveBrandingFile(
	file: File,
	kind: BrandingKind,
	slug: string,
	brandingDir: string,
): Promise<{ ok: true; publicPath: string } | { ok: false; error: string }> {
	if (file.size > MAX_FILE_SIZE) {
		return {
			ok: false,
			error:
				kind === "logo" ? "Logo file too large" : "Background file too large",
		};
	}
	const buffer = Buffer.from(await file.arrayBuffer());
	const detected = detectImageType(buffer);
	if (!detected) {
		return {
			ok: false,
			error:
				kind === "logo"
					? "Invalid logo file type"
					: "Invalid background file type",
		};
	}

	const fileName = `${kind}.${detected.ext}`;
	const resolvedDir = path.resolve(/* turbopackIgnore: true */ brandingDir);
	const fullPath = path.resolve(resolvedDir, fileName);
	if (!fullPath.startsWith(resolvedDir + path.sep)) {
		return { ok: false, error: "Invalid path" };
	}

	await removeBrandingFiles(resolvedDir, kind);
	await writeFile(fullPath, buffer);
	return {
		ok: true,
		publicPath: path.posix.join(
			"/data",
			"galleries",
			slug,
			"branding",
			fileName,
		),
	};
}

/** Usuwa wszystkie warianty pliku danego rodzaju (stały zestaw nazw, bez wartości z DB). */
async function removeBrandingFiles(
	brandingDir: string,
	kind: BrandingKind,
): Promise<void> {
	for (const ext of KNOWN_EXTS) {
		try {
			await unlink(path.join(brandingDir, `${kind}.${ext}`));
		} catch {
			// plik nie istnieje
		}
	}
}

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
		if (!safeBrandingDir.startsWith(safeDataDir + path.sep)) {
			return NextResponse.json({ error: "Invalid path" }, { status: 403 });
		}

		await mkdir(brandingDir, { recursive: true });

		let logoPath: string | undefined;
		let backgroundPath: string | undefined;

		if (logo) {
			const result = await saveBrandingFile(logo, "logo", slug, brandingDir);
			if (!result.ok) {
				return NextResponse.json({ error: result.error }, { status: 400 });
			}
			logoPath = result.publicPath;
		}

		if (background) {
			const result = await saveBrandingFile(
				background,
				"background",
				slug,
				brandingDir,
			);
			if (!result.ok) {
				return NextResponse.json({ error: result.error }, { status: 400 });
			}
			backgroundPath = result.publicPath;
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
				await removeBrandingFiles(path.resolve(brandingDir), "logo");
				await db
					.update(galleryBranding)
					.set({
						logoPath: null,
						updatedAt: new Date(),
					})
					.where(eq(galleryBranding.galleryId, auth.gallery.id));
			}

			if (parsed.data.type === "background" && existing.backgroundPath) {
				await removeBrandingFiles(path.resolve(brandingDir), "background");
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
