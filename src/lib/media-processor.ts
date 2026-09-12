import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import PQueue from "p-queue";
import { db } from "../db";
import { mediaItems, galleries } from "../db/schema";
import { eq } from "drizzle-orm";
import { sseBus } from "./sse-bus";

// Ograniczenie współbieżności do 2 procesów naraz - krytyczne dla 4-rdzeniowego Intel N100!
export const mediaQueue = new PQueue({ concurrency: 2 });

export interface ProcessTask {
  uploadId: string;
  tempFilePath: string;
  gallerySlug: string;
  uploaderName: string;
  originalName: string;
  fileType: "image" | "video";
  mimeType: string;
  fileSize: number;
  dataDir: string;
}

export async function scheduleMediaProcessing(task: ProcessTask) {
  return mediaQueue.add(() => processMedia(task));
}

async function processMedia(task: ProcessTask) {
  const { uploadId, tempFilePath, gallerySlug, uploaderName, originalName, fileType, mimeType, fileSize, dataDir } = task;

  try {
    // 1. Wyszukanie ID galerii w bazie
    const galleryResult = await db.select().from(galleries).where(eq(galleries.slug, gallerySlug)).limit(1);
    if (!galleryResult.length) {
      console.error(`[Processor] Galeria ${gallerySlug} nie istnieje w bazie.`);
      await fs.unlink(tempFilePath).catch(() => {});
      return;
    }
    const gallery = galleryResult[0];

    // 2. Przygotowanie docelowych folderów
    const rawDir = path.join(dataDir, "galleries", gallerySlug, "raw");
    const thumbsDir = path.join(dataDir, "galleries", gallerySlug, "thumbs");
    await fs.mkdir(rawDir, { recursive: true });
    await fs.mkdir(thumbsDir, { recursive: true });

    const safeExt = path.extname(originalName) || (fileType === "video" ? ".mp4" : ".jpg");
    const rawFileName = `${uploadId}${safeExt}`;
    const targetRawPath = path.join(rawDir, rawFileName);

    // Przeniesienie pliku z TUS temp do docelowego folderu raw
    await fs.rename(tempFilePath, targetRawPath);

    const thumbFileName = `${uploadId}_thumb.webp`;
    const targetThumbPath = path.join(thumbsDir, thumbFileName);

    let width: number | null = null;
    let height: number | null = null;
    let duration: number | null = null;

    // 3. Generowanie miniaturki
    if (fileType === "image") {
      try {
        const image = sharp(targetRawPath, { failOn: "none" }).rotate(); // Auto-obrót z EXIF!
        const metadata = await image.metadata();
        width = metadata.width || null;
        height = metadata.height || null;

        // Miniaturka kwadratowa WebP 500x500 do szybkiego gridu
        await image
          .resize(500, 500, { fit: "cover", position: "center" })
          .webp({ quality: 80 })
          .toFile(targetThumbPath);
      } catch (sharpErr) {
        console.error(`[Processor] Sharp error dla pliku ${rawFileName}:`, sharpErr);
      }
    } else {
      // Dla wideo wyciągamy klatkę kluczową z 1. sekundy za pomocą FFmpeg
      try {
        await extractVideoThumbnail(targetRawPath, targetThumbPath);
      } catch (ffmpegErr) {
        console.warn(`[Processor] FFmpeg niedostępny lub błąd miniatury wideo, używam placeholdera.`, ffmpegErr);
      }
    }

    // 4. Zapis do bazy danych PostgreSQL (zawsze ze znormalizowanymi ukośnikami POSIX)
    const relativeRaw = path.posix.join("galleries", gallerySlug, "raw", rawFileName);
    const relativeThumb = existsSync(targetThumbPath)
      ? path.posix.join("galleries", gallerySlug, "thumbs", thumbFileName)
      : relativeRaw;

    const [newMedia] = await db
      .insert(mediaItems)
      .values({
        galleryId: gallery.id,
        uploaderName: uploaderName || "Gość weselny",
        fileType,
        mimeType: mimeType || (fileType === "video" ? "video/mp4" : "image/jpeg"),
        originalFileName: originalName,
        fileSize,
        storagePath: relativeRaw,
        thumbPath: relativeThumb,
        width,
        height,
        duration,
        status: "ready",
      })
      .returning();

    // 5. Powiadomienie gości w czasie rzeczywistym (SSE)
    sseBus.notifyNewMedia(gallerySlug, newMedia);
    console.log(`[Processor] Pomyślnie przetworzono plik: ${originalName} dla galerii ${gallerySlug}`);
  } catch (err) {
    console.error(`[Processor] Błąd krytyczny przetwarzania pliku ${originalName}:`, err);
  }
}

function extractVideoThumbnail(videoPath: string, outputThumbPath: string, timeoutMs = 25000): Promise<void> {
  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | null = null;
    let isSettled = false;

    // ffmpeg -ss 00:00:01 -i input -vframes 1 -vf scale=500:500:force_original_aspect_ratio=increase,crop=500:500 -q:v 3 out.webp
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-ss", "00:00:01",
      "-i", videoPath,
      "-vframes", "1",
      "-vf", "scale=500:500:force_original_aspect_ratio=increase,crop=500:500",
      outputThumbPath,
    ]);

    timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        ffmpeg.kill("SIGKILL");
        reject(new Error(`FFmpeg przekroczył limit czasu (${timeoutMs} ms)`));
      }
    }, timeoutMs);

    ffmpeg.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (isSettled) return;
      isSettled = true;
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });

    ffmpeg.on("error", (err) => {
      if (timer) clearTimeout(timer);
      if (isSettled) return;
      isSettled = true;
      reject(err);
    });
  });
}
