import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { galleries, cardSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateWeddingCardPdf } from "@/lib/pdf-card";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const galleryResult = await db
      .select()
      .from(galleries)
      .where(eq(galleries.slug, slug))
      .limit(1);

    if (!galleryResult.length) {
      return NextResponse.json({ error: "Galeria nie istnieje" }, { status: 404 });
    }

    const gallery = galleryResult[0];

    const cardResult = await db
      .select()
      .from(cardSettings)
      .where(eq(cardSettings.galleryId, gallery.id))
      .limit(1);

    const card = cardResult[0] || {};
    const { searchParams } = new URL(req.url);

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const appDomain = process.env.APP_DOMAIN || `${proto}://${host}`;
    const targetUrl = `${appDomain}/g/${gallery.slug}`;

    const headline = searchParams.get("headline") || card.headline || "Podziel się wspomnieniami!";
    const instructions = searchParams.get("instructions") || card.customInstructions;
    const primaryColorHex = searchParams.get("primaryColor") || card.primaryColor || "#1E293B";
    const accentColorHex = searchParams.get("accentColor") || card.accentColor || "#D4AF37";

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

    return new Response(Buffer.from(pdfBytes) as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="karteczka-stol-${slug}.pdf"`,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error("Błąd generowania PDF:", error);
    return NextResponse.json({ error: "Nie udało się wygenerować PDF" }, { status: 500 });
  }
}
