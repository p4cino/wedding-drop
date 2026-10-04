export type RecordingKind = "audio" | "video";

const CANDIDATES: Record<RecordingKind, string[]> = {
	audio: [
		"audio/webm;codecs=opus",
		"audio/webm",
		"audio/mp4",
		"audio/ogg;codecs=opus",
	],
	video: [
		"video/webm;codecs=vp9,opus",
		"video/webm;codecs=vp8,opus",
		"video/webm",
		"video/mp4",
	],
};

/** Pierwszy format wspierany przez MediaRecorder danej przeglądarki (Chrome: WebM, Safari: MP4). */
export function pickRecorderMimeType(
	kind: RecordingKind,
	isSupported: (mime: string) => boolean,
): string | undefined {
	return CANDIDATES[kind].find((mime) => isSupported(mime));
}

export function extensionForMime(mime: string): "webm" | "mp4" | "ogg" {
	const base = mime.toLowerCase().split(";")[0];
	if (base.endsWith("/mp4")) return "mp4";
	if (base.endsWith("/ogg")) return "ogg";
	return "webm";
}

/** Nazwa i typ MIME pochodzą z faktycznego formatu nagrania, nie z założeń o przeglądarce. */
export function buildRecordingFile(
	chunks: Blob[],
	recorderMime: string,
	kind: RecordingKind,
	now: number = Date.now(),
): File {
	const base = (recorderMime || "").split(";")[0] || `${kind}/webm`;
	const type = base.startsWith(`${kind}/`)
		? base
		: `${kind}/${base.split("/")[1] || "webm"}`;
	return new File(
		[new Blob(chunks, { type })],
		`zyczenia_${now}.${extensionForMime(type)}`,
		{
			type,
		},
	);
}
