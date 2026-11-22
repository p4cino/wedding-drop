import type { MediaItem } from "@wedding-drop/db";

/**
 * Serializuje rekord `media_items` do spójnego publicznego DTO używanego
 * przez `GET /api/gallery/[slug]/media` oraz zdarzenie SSE `new-media`.
 */
export function serializePublicMediaItem(m: MediaItem) {
	return {
		id: m.id,
		uploaderName: m.uploaderName,
		source: m.source,
		fileType: m.fileType,
		mediaType: m.mediaType,
		mimeType: m.mimeType,
		originalFileName: m.originalFileName,
		fileSize: m.fileSize,
		width: m.width ?? null,
		height: m.height ?? null,
		duration: m.duration ?? null,
		status: m.status,
		likesCount: m.likesCount ?? 0,
		caption: m.caption ?? null,
		questId: m.questId ?? null,
		createdAt: m.createdAt,
		thumbUrl: `/media-file/${m.thumbPath.replace(/\\/g, "/")}`,
		rawUrl: `/media-file/${m.storagePath.replace(/\\/g, "/")}`,
	};
}
