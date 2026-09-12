import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { galleries, mediaItems, cardSettings } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import path from "node:path";
import fs from "node:fs/promises";

import { sseBus } from "@/lib/sse-bus";
import { isGoogleDriveConfigured } from "@/lib/google-drive";
import { startGalleryDriveExport } from "@/lib/gdrive-exporter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, slug, password } = body;

    const galleryResult = await db
      .select()
      .from(galleries)
      .where(eq(galleries.slug, slug))
      .limit(1);

    if (!galleryResult.length) {
      return NextResponse.json({ error: "Galeria nie istnieje" }, { status: 404 });
    }

    const gallery = galleryResult[0];

    // 1. Logowanie pary młodej
    if (action === "login") {
      const isValid = await bcrypt.compare(password, gallery.ownerPasswordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Nieprawidłowe hasło" }, { status: 401 });
      }

      // Pobieranie statystyk
      const stats = await db
        .select({
          totalFiles: sql<number>`count(*)`,
          totalBytes: sql<number>`COALESCE(sum(${mediaItems.fileSize}), 0)`,
        })
        .from(mediaItems)
        .where(eq(mediaItems.galleryId, gallery.id));

      const card = await db
        .select()
        .from(cardSettings)
        .where(eq(cardSettings.galleryId, gallery.id))
        .limit(1);

      let progressParsed = null;
      try {
        if (gallery.gdriveExportProgress) {
          progressParsed = JSON.parse(gallery.gdriveExportProgress);
        }
      } catch (e) {}

      return NextResponse.json({
        success: true,
        gallery: {
          id: gallery.id,
          slug: gallery.slug,
          coupleNames: gallery.coupleNames,
          weddingDate: gallery.weddingDate,
          allowGuestDownloads: gallery.allowGuestDownloads,
          allowVideos: gallery.allowVideos,
          hasGDrive: Boolean(gallery.gdriveRefreshToken),
          gdriveAccountEmail: gallery.gdriveAccountEmail,
          gdriveExportStatus: gallery.gdriveExportStatus,
          gdriveExportProgress: progressParsed,
          gdriveExportedAt: gallery.gdriveExportedAt,
          gdriveRootFolderId: gallery.gdriveRootFolderId,
        },
        stats: stats[0] || { totalFiles: 0, totalBytes: 0 },
        cardSettings: card[0] || null,
        isGDriveConfigured: isGoogleDriveConfigured(),
      });
    }

    // Weryfikacja hasła do dalszych akcji
    const isValid = await bcrypt.compare(password, gallery.ownerPasswordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    // 2. Zmiana statusu zdjęcia (ukryj / pokaż)
    if (action === "toggle-status") {
      const { mediaId, newStatus } = body;
      const validStatus = newStatus === "hidden" ? "hidden" : "ready";
      await db
        .update(mediaItems)
        .set({ status: validStatus })
        .where(and(eq(mediaItems.id, mediaId), eq(mediaItems.galleryId, gallery.id)));

      // Powiadomienie gości w czasie rzeczywistym o ukryciu/odkryciu
      sseBus.notifyMediaUpdated(slug, { mediaId, status: validStatus });

      return NextResponse.json({ success: true, newStatus: validStatus });
    }

    // 3. Usunięcie zdjęcia
    if (action === "delete-media") {
      const { mediaId } = body;
      const itemResult = await db
        .select()
        .from(mediaItems)
        .where(and(eq(mediaItems.id, mediaId), eq(mediaItems.galleryId, gallery.id)))
        .limit(1);

      if (itemResult.length) {
        const item = itemResult[0];
        const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
        // Usunięcie plików z dysku
        await fs.unlink(path.join(dataDir, item.storagePath)).catch(() => {});
        await fs.unlink(path.join(dataDir, item.thumbPath)).catch(() => {});

        await db.delete(mediaItems).where(eq(mediaItems.id, mediaId));

        // Powiadomienie gości w czasie rzeczywistym o usunięciu
        sseBus.notifyMediaUpdated(slug, { mediaId, status: "deleted" });
      }

      return NextResponse.json({ success: true });
    }

    // 4. Aktualizacja ustawień karteczki do druku
    if (action === "update-card") {
      const { headline, subheadline, primaryColor, accentColor, customInstructions } = body;

      const existing = await db
        .select()
        .from(cardSettings)
        .where(eq(cardSettings.galleryId, gallery.id))
        .limit(1);

      if (existing.length) {
        await db
          .update(cardSettings)
          .set({
            headline,
            subheadline,
            primaryColor,
            accentColor,
            customInstructions,
          })
          .where(eq(cardSettings.galleryId, gallery.id));
      } else {
        await db.insert(cardSettings).values({
          galleryId: gallery.id,
          headline,
          subheadline,
          primaryColor,
          accentColor,
          customInstructions,
        });
      }

      return NextResponse.json({ success: true });
    }

    // 5. Uruchomienie eksportu do Google Drive
    if (action === "start-gdrive-export") {
      const { includeHidden } = body;
      const result = await startGalleryDriveExport(slug, { includeHidden: Boolean(includeHidden) });
      return NextResponse.json(result);
    }

    // 6. Odłączenie konta Google Drive
    if (action === "disconnect-gdrive") {
      await db
        .update(galleries)
        .set({
          gdriveRefreshToken: null,
          gdriveAccountEmail: null,
          gdriveExportStatus: "idle",
          gdriveExportProgress: null,
        })
        .where(eq(galleries.id, gallery.id));

      return NextResponse.json({ success: true, message: "Konto Google Drive zostało odłączone." });
    }

    // 7. Pobranie aktualnego statusu eksportu Google Drive
    if (action === "get-gdrive-status") {
      const freshGallery = await db
        .select()
        .from(galleries)
        .where(eq(galleries.id, gallery.id))
        .limit(1);

      if (!freshGallery.length) {
        return NextResponse.json({ error: "Galeria nie istnieje" }, { status: 404 });
      }

      const g = freshGallery[0];
      let progress = null;
      try {
        if (g.gdriveExportProgress) {
          progress = JSON.parse(g.gdriveExportProgress);
        }
      } catch (e) {}

      return NextResponse.json({
        success: true,
        hasGDrive: Boolean(g.gdriveRefreshToken),
        gdriveAccountEmail: g.gdriveAccountEmail,
        gdriveExportStatus: g.gdriveExportStatus,
        gdriveExportProgress: progress,
        gdriveExportedAt: g.gdriveExportedAt,
        gdriveRootFolderId: g.gdriveRootFolderId,
      });
    }

    return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
  } catch (error) {
    console.error("Błąd w endpoint owner:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
