import { describe, expect, it } from "vitest";
import {
	buildRecordingFile,
	extensionForMime,
	pickRecorderMimeType,
} from "@/lib/recorder-formats";

describe("recorder-formats", () => {
	it("wybiera pierwszy wspierany format (Chrome: WebM)", () => {
		expect(
			pickRecorderMimeType("audio", (m) => m.startsWith("audio/webm")),
		).toBe("audio/webm;codecs=opus");
		expect(
			pickRecorderMimeType("video", (m) => m.startsWith("video/webm")),
		).toBe("video/webm;codecs=vp9,opus");
	});

	it("wybiera MP4 w Safari, gdzie WebM nie jest wspierany", () => {
		expect(pickRecorderMimeType("audio", (m) => m === "audio/mp4")).toBe(
			"audio/mp4",
		);
		expect(pickRecorderMimeType("video", (m) => m === "video/mp4")).toBe(
			"video/mp4",
		);
	});

	it("zwraca undefined, gdy nic nie jest wspierane", () => {
		expect(pickRecorderMimeType("video", () => false)).toBeUndefined();
	});

	it("mapuje MIME na rozszerzenie", () => {
		expect(extensionForMime("video/mp4")).toBe("mp4");
		expect(extensionForMime("audio/ogg;codecs=opus")).toBe("ogg");
		expect(extensionForMime("audio/webm;codecs=opus")).toBe("webm");
	});

	it("buduje plik z faktycznego formatu nagrania, bez parametrów codecs", () => {
		const file = buildRecordingFile(
			[new Blob(["a"])],
			"video/mp4;codecs=avc1",
			"video",
			123,
		);
		expect(file.name).toBe("zyczenia_123.mp4");
		expect(file.type).toBe("video/mp4");
	});

	it("wymusza zgodność rodzaju MIME z rodzajem nagrania", () => {
		const file = buildRecordingFile([], "video/webm", "audio", 1);
		expect(file.type).toBe("audio/webm");
		expect(file.name).toBe("zyczenia_1.webm");
	});
});
