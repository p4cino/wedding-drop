export type MediaFileType = "image" | "video" | "audio";
export type MediaKind = "photo" | "video" | "audio";

const AUDIO_EXT = /\.(mp3|wav|aac|m4a|ogg|oga|opus|flac)$/i;
const VIDEO_EXT = /\.(mp4|mov|avi|webm|mkv)$/i;

/**
 * Jedyne miejsce klasyfikujące upload. MIME ma pierwszeństwo; rozszerzenie
 * rozstrzyga dopiero, gdy przeglądarka nie podała typu. `.webm` bez MIME to wideo
 * (nagranie audio z MediaRecorder zawsze niesie `audio/webm`).
 */
export function classifyMedia(
	mimeType: string | undefined,
	originalName: string | undefined,
): { fileType: MediaFileType; mediaType: MediaKind } {
	const mime = (mimeType || "").toLowerCase();
	const name = originalName || "";

	if (mime.startsWith("audio/")) {
		return { fileType: "audio", mediaType: "audio" };
	}
	if (mime.startsWith("video/")) {
		return { fileType: "video", mediaType: "video" };
	}
	if (mime.startsWith("image/")) {
		return { fileType: "image", mediaType: "photo" };
	}
	if (AUDIO_EXT.test(name)) {
		return { fileType: "audio", mediaType: "audio" };
	}
	if (VIDEO_EXT.test(name)) {
		return { fileType: "video", mediaType: "video" };
	}
	return { fileType: "image", mediaType: "photo" };
}
