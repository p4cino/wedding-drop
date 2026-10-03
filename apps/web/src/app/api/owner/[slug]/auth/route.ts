import { compare } from "@node-rs/bcrypt";
import {
	db,
	galleries,
	galleryGdriveExports,
	ownerLoginDto,
} from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { generateOwnerToken, setOwnerSessionCookie } from "@/lib/auth";
import { buildOwnerPanelPayload } from "@/lib/owner-panel-payload";

export const dynamic = "force-dynamic";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;
		const body = await req.json();
		const parseResult = ownerLoginDto.safeParse(body);
		if (!parseResult.success) {
			return NextResponse.json(
				{
					error: parseResult.error.issues[0]?.message || "Hasło jest wymagane",
					details: parseResult.error.flatten(),
				},
				{ status: 400 },
			);
		}
		const { password } = parseResult.data;

		const galleryResult = await db
			.select({ gallery: galleries, gdrive: galleryGdriveExports })
			.from(galleries)
			.leftJoin(
				galleryGdriveExports,
				eq(galleries.id, galleryGdriveExports.galleryId),
			)
			.where(eq(galleries.slug, slug))
			.limit(1);

		if (!galleryResult.length) {
			return NextResponse.json(
				{ error: "Galeria nie istnieje" },
				{ status: 404 },
			);
		}

		const { gallery, gdrive } = galleryResult[0];

		const isValid = await compare(password, gallery.ownerPasswordHash);
		if (!isValid) {
			return NextResponse.json(
				{ error: "Nieprawidłowe hasło" },
				{ status: 401 },
			);
		}

		const ownerToken = generateOwnerToken(slug);
		const payload = await buildOwnerPanelPayload(gallery, gdrive);
		const res = NextResponse.json({
			...payload,
			ownerToken,
		});
		setOwnerSessionCookie(res, slug, ownerToken);
		return res;
	} catch (error) {
		console.error("Błąd w endpoint owner auth:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}
