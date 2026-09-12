import { NextRequest } from "next/server";
import { sseBus } from "@/lib/sse-bus";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Powitanie klienta
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", slug })}\n\n`));

      // Nasłuch na nowe pliki dla tego konkretnego wesela
      const onNewMedia = (mediaItem: any) => {
        try {
          const payload = JSON.stringify({
            type: "new-media",
            media: {
              id: mediaItem.id,
              uploaderName: mediaItem.uploaderName,
              fileType: mediaItem.fileType,
              mimeType: mediaItem.mimeType,
              originalFileName: mediaItem.originalFileName,
              fileSize: mediaItem.fileSize,
              thumbUrl: `/media-file/${mediaItem.thumbPath.replace(/\\/g, "/")}`,
              rawUrl: `/media-file/${mediaItem.storagePath.replace(/\\/g, "/")}`,
              createdAt: mediaItem.createdAt,
            },
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (err) {
          console.error("Błąd wysyłania SSE:", err);
        }
      };

      const eventName = `new-media:${slug}`;
      const updateEventName = `media-updated:${slug}`;
      const gdriveEventName = `gdrive-progress:${slug}`;

      const onMediaUpdated = (update: any) => {
        try {
          const payload = JSON.stringify({
            type: "media-updated",
            update: {
              mediaId: update.mediaId,
              status: update.status,
            },
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (err) {
          console.error("Błąd wysyłania SSE update:", err);
        }
      };

      const onGDriveProgress = (progress: any) => {
        try {
          const payload = JSON.stringify({
            type: "gdrive-progress",
            progress,
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (err) {
          console.error("Błąd wysyłania SSE gdrive-progress:", err);
        }
      };

      sseBus.on(eventName, onNewMedia);
      sseBus.on(updateEventName, onMediaUpdated);
      sseBus.on(gdriveEventName, onGDriveProgress);

      // Heartbeat / ping co 25s, by zapobiec zamykaniu połączenia przez proxy sieci komórkowych
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (e) {
          clearInterval(pingInterval);
        }
      }, 25000);

      // Sprzątanie po rozłączeniu gościa
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        sseBus.off(eventName, onNewMedia);
        sseBus.off(updateEventName, onMediaUpdated);
        sseBus.off(gdriveEventName, onGDriveProgress);
        try {
          controller.close();
        } catch (e) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Ważne dla Caddy/Nginx, by nie buforować SSE!
    },
  });
}
