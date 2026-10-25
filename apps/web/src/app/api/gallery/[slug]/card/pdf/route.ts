import { cardSettings, db, galleries } from "@wedding-drop/db";
import { generateWeddingCardPdf } from "@wedding-drop/media";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

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

		const cardResult = await db
			.select()
			.from(cardSettings)
			.where(eq(cardSettings.galleryId, gallery.id))
			.limit(1);

		const card = cardResult[0] || {};
		const { searchParams } = new URL(req.url);

		const rawHost =
			req.headers.get("x-forwarded-host") ||
			req.headers.get("host") ||
			"localhost:3000";
		const safeHost =
			rawHost
				.split(",")[0]
				?.trim()
				.replace(/[^a-zA-Z0-9.:-]/g, "") || "localhost:3000";
		const rawProto = req.headers.get("x-forwarded-proto") || "http";
		const safeProto = rawProto === "https" ? "https" : "http";
		const appDomain = (
			process.env.APP_DOMAIN || `${safeProto}://${safeHost}`
		).replace(/\/$/, "");
		const targetUrl = `${appDomain}/g/${gallery.slug}`;

		const rawHeadline = searchParams.get("headline")?.trim();
		const headline =
			rawHeadline?.slice(0, 120) ||
			card.headline ||
			"Podziel się wspomnieniami!";

		const rawInstructions = searchParams.get("instructions");
		const instructions =
			rawInstructions?.slice(0, 500) || card.customInstructions;

		const queryPrimary = searchParams.get("primaryColor");
		const primaryColorHex =
			queryPrimary && HEX_COLOR_RE.test(queryPrimary)
				? queryPrimary
				: card.primaryColor && HEX_COLOR_RE.test(card.primaryColor)
					? card.primaryColor
					: "#1E293B";

		const queryAccent = searchParams.get("accentColor");
		const accentColorHex =
			queryAccent && HEX_COLOR_RE.test(queryAccent)
				? queryAccent
				: card.accentColor && HEX_COLOR_RE.test(card.accentColor)
					? card.accentColor
					: "#D4AF37";

		const pdfBytes = await generateWeddingCardPdf({
			coupleNames: gallery.coupleNames,
			weddingDate: gallery.weddingDate,
			targetUrl,
			headline,
			subheadline: card.subheadline,
			instructions,
			primaryColorHex,
			accentColorHex,
		});

		return new Response(Buffer.from(pdfBytes) as unknown as BodyInit, {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `inline; filename="karteczka-stol-${slug}.pdf"`,
				"Cache-Control": "public, max-age=60",
			},
		});
	} catch (error) {
		console.error("Błąd generowania PDF:", error);
		return NextResponse.json(
			{ error: "Nie udało się wygenerować PDF" },
			{ status: 500 },
		);
	}
}
