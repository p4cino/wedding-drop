// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import {
	canvasToJpegFile,
	captureFrameToCanvas,
	computeCaptureDimensions,
	DEFAULT_ACCENT_COLOR,
	DEFAULT_PRIMARY_COLOR,
	drawPhotoboothFrame,
	isCameraSupported,
} from "@/lib/photobooth";
import {
	removeMediaDevices,
	stubMediaDevices,
} from "../../helpers/media-devices";

describe("computeCaptureDimensions", () => {
	it("zachowuje faktyczne wymiary strumienia wideo, gdy dłuższy bok mieści się w limicie", () => {
		expect(computeCaptureDimensions(1280, 720)).toEqual({
			width: 1280,
			height: 720,
		});
	});

	it("skaluje proporcjonalnie w dół, gdy dłuższy bok przekracza maksymalny rozmiar", () => {
		const result = computeCaptureDimensions(3840, 2160, 1920);
		expect(result.width).toBe(1920);
		expect(result.height).toBe(1080);
	});

	it("skaluje w dół również dla orientacji pionowej (portrait)", () => {
		const result = computeCaptureDimensions(2160, 3840, 1920);
		expect(result.height).toBe(1920);
		expect(result.width).toBe(1080);
	});

	it("nigdy nie skaluje w górę, gdy strumień jest mniejszy niż limit", () => {
		expect(computeCaptureDimensions(640, 480, 1920)).toEqual({
			width: 640,
			height: 480,
		});
	});

	it("zwraca zerowe wymiary dla niepoprawnych danych wejściowych", () => {
		expect(computeCaptureDimensions(0, 0)).toEqual({ width: 0, height: 0 });
	});
});

function createMockCtx() {
	return {
		fillRect: vi.fn(),
		strokeRect: vi.fn(),
		drawImage: vi.fn(),
		fillStyle: "",
		strokeStyle: "",
		lineWidth: 0,
	} as unknown as CanvasRenderingContext2D;
}

describe("drawPhotoboothFrame", () => {
	it("używa przekazanych kolorów motywu wesela do rysowania ramki", () => {
		const ctx = createMockCtx();
		drawPhotoboothFrame(ctx, 800, 600, {
			primaryColor: "#112233",
			accentColor: "#AABBCC",
		});

		// Cztery pasy grubej ramki w kolorze podstawowym
		expect(ctx.fillRect).toHaveBeenCalledTimes(4);
		expect(ctx.fillStyle).toBe("#112233");
		// Cienka linia akcentowa
		expect(ctx.strokeRect).toHaveBeenCalledTimes(1);
		expect(ctx.strokeStyle).toBe("#AABBCC");
	});

	it("stosuje domyślne kolory generatora winietek, gdy nie podano kolorów motywu", () => {
		const ctx = createMockCtx();
		drawPhotoboothFrame(ctx, 800, 600);

		expect(ctx.fillStyle).toBe(DEFAULT_PRIMARY_COLOR);
		expect(ctx.strokeStyle).toBe(DEFAULT_ACCENT_COLOR);
	});

	it("stosuje domyślne kolory, gdy galeria przekazała puste stringi", () => {
		const ctx = createMockCtx();
		drawPhotoboothFrame(ctx, 800, 600, { primaryColor: "", accentColor: "" });

		expect(ctx.fillStyle).toBe(DEFAULT_PRIMARY_COLOR);
		expect(ctx.strokeStyle).toBe(DEFAULT_ACCENT_COLOR);
	});

	it("nie rysuje niczego dla niepoprawnych wymiarów", () => {
		const ctx = createMockCtx();
		drawPhotoboothFrame(ctx, 0, 0);

		expect(ctx.fillRect).not.toHaveBeenCalled();
		expect(ctx.strokeRect).not.toHaveBeenCalled();
	});
});

describe("captureFrameToCanvas", () => {
	it("ustawia wymiary canvasu na podstawie faktycznych wymiarów strumienia wideo", () => {
		const video = { videoWidth: 1280, videoHeight: 720 } as HTMLVideoElement;
		const canvas = document.createElement("canvas");

		const size = captureFrameToCanvas(video, canvas, {
			primaryColor: "#112233",
			accentColor: "#AABBCC",
		});

		expect(size).toEqual({ width: 1280, height: 720 });
		expect(canvas.width).toBe(1280);
		expect(canvas.height).toBe(720);
	});

	it("rysuje klatkę wideo i ramkę na canvasie, gdy dostępny jest kontekst 2D", () => {
		const video = { videoWidth: 640, videoHeight: 480 } as HTMLVideoElement;
		const canvas = document.createElement("canvas");
		const ctx = createMockCtx();
		vi.spyOn(canvas, "getContext").mockReturnValue(
			ctx as unknown as RenderingContext,
		);

		captureFrameToCanvas(video, canvas, { primaryColor: "#000000" });

		expect(ctx.drawImage).toHaveBeenCalledWith(video, 0, 0, 640, 480);
		expect(ctx.fillRect).toHaveBeenCalled();
	});
});

describe("canvasToJpegFile", () => {
	it("eksportuje canvas jako File typu image/jpeg z podaną nazwą", async () => {
		const canvas = document.createElement("canvas");
		const fakeBlob = new Blob(["dane-obrazu"], { type: "image/jpeg" });
		canvas.toBlob = vi.fn((callback: BlobCallback) => callback(fakeBlob));

		const file = await canvasToJpegFile(canvas, "photobooth_123.jpg");

		expect(file).toBeInstanceOf(File);
		expect(file.name).toBe("photobooth_123.jpg");
		expect(file.type).toBe("image/jpeg");
		expect(file.size).toBe(fakeBlob.size);
	});

	it("wywołuje toBlob z jakością 0.92 domyślnie", async () => {
		const canvas = document.createElement("canvas");
		const toBlobSpy = vi.fn((callback: BlobCallback) =>
			callback(new Blob(["x"], { type: "image/jpeg" })),
		);
		canvas.toBlob = toBlobSpy;

		await canvasToJpegFile(canvas, "test.jpg");

		expect(toBlobSpy).toHaveBeenCalledWith(
			expect.any(Function),
			"image/jpeg",
			0.92,
		);
	});

	it("odrzuca obietnicę, gdy canvas.toBlob zwróci null", async () => {
		const canvas = document.createElement("canvas");
		canvas.toBlob = vi.fn((callback: BlobCallback) => callback(null));

		await expect(canvasToJpegFile(canvas, "test.jpg")).rejects.toThrow();
	});
});

describe("isCameraSupported", () => {
	it("zwraca true, gdy istnieje getUserMedia, i false bez mediaDevices", () => {
		stubMediaDevices();
		expect(isCameraSupported()).toBe(true);
		removeMediaDevices();
		expect(isCameraSupported()).toBe(false);
	});
});
