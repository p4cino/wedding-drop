import { describe, expect, it } from "vitest";
import { classifyMedia } from "../src/media-kind";

describe("classifyMedia", () => {
	it.each([
		["image/jpeg", "a.jpg", "image", "photo"],
		["video/mp4", "a.mp4", "video", "video"],
		["video/webm", "recording.webm", "video", "video"],
		["audio/webm", "recording.webm", "audio", "audio"],
		["audio/mp4", "a.m4a", "audio", "audio"],
		["AUDIO/MPEG", "a.mp3", "audio", "audio"],
	])("%s (%s) -> %s/%s", (mime, name, fileType, mediaType) => {
		expect(classifyMedia(mime, name)).toEqual({ fileType, mediaType });
	});

	it("MIME ma pierwszeństwo nad rozszerzeniem", () => {
		expect(classifyMedia("video/webm", "x.mp3").mediaType).toBe("video");
	});

	it("bez MIME rozstrzyga rozszerzenie; .webm to wideo", () => {
		expect(classifyMedia("", "x.mp3").mediaType).toBe("audio");
		expect(classifyMedia(undefined, "x.webm").mediaType).toBe("video");
		expect(classifyMedia("", "x.mov").mediaType).toBe("video");
	});

	it("nieznany plik domyślnie jest zdjęciem", () => {
		expect(classifyMedia("", "plik").mediaType).toBe("photo");
	});
});
