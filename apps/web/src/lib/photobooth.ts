/**
 * Czyste funkcje pomocnicze dla funkcji "Zrób zdjęcie" (photobooth) w przeglądarce gościa.
 *
 * Świadomie odseparowane od komponentu React `CameraCapture`, aby dało się je
 * jednostkowo przetestować bez konieczności mockowania całego cyklu życia
 * komponentu / `getUserMedia`.
 */

import { DEFAULT_CARD_COLORS } from "@/lib/card-defaults";

// Te same domyślne kolory co generator winietek A6 (patrz `packages/media/src/pdf-card.ts`
// i `GET /api/gallery/[slug]/card/pdf`), żeby zachowanie było spójne z resztą aplikacji.
export const DEFAULT_PRIMARY_COLOR: string = DEFAULT_CARD_COLORS.primary;
export const DEFAULT_ACCENT_COLOR: string = DEFAULT_CARD_COLORS.accent;

// Maksymalny rozmiar dłuższego boku eksportowanego zdjęcia — ogranicza rozmiar
// pliku ze zrzutów kamer 4K na nowszych telefonach (Quad HD 2560px), patrz design.md „Risks”.
export const MAX_CAPTURE_DIMENSION = 2560;

export interface PhotoboothColors {
	primaryColor?: string | null;
	accentColor?: string | null;
}

export interface CanvasSize {
	width: number;
	height: number;
}

/**
 * Wylicza wymiary canvasu na podstawie faktycznych wymiarów strumienia wideo
 * lub zdjęcia źródłowego, skalując proporcjonalnie w dół,
 * gdy dłuższy bok przekracza `maxDimension`. Nigdy nie skaluje w górę.
 */
export function computeCaptureDimensions(
	videoWidth: number,
	videoHeight: number,
	maxDimension: number = MAX_CAPTURE_DIMENSION,
): CanvasSize {
	if (videoWidth <= 0 || videoHeight <= 0) {
		return { width: 0, height: 0 };
	}

	const longerSide = Math.max(videoWidth, videoHeight);
	if (longerSide <= maxDimension) {
		return { width: Math.round(videoWidth), height: Math.round(videoHeight) };
	}

	const scale = maxDimension / longerSide;
	return {
		width: Math.round(videoWidth * scale),
		height: Math.round(videoHeight * scale),
	};
}

/**
 * Rysuje dekoracyjną ramkę w kolorach motywu wesela na przekazanym kontekście
 * canvasu. Bezpieczne dla brakujących/pustych kolorów — wtedy stosuje domyślne
 * kolory generatora winietek.
 */
export function drawPhotoboothFrame(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	colors?: PhotoboothColors,
): void {
	if (width <= 0 || height <= 0) return;

	const primaryColor = colors?.primaryColor || DEFAULT_PRIMARY_COLOR;
	const accentColor = colors?.accentColor || DEFAULT_ACCENT_COLOR;

	const borderThickness = Math.max(
		8,
		Math.round(Math.min(width, height) * 0.035),
	);

	// Zewnętrzna gruba ramka w kolorze podstawowym motywu (cztery pasy zamiast
	// jednego strokeRect, by uniknąć problemów z przezroczystością narożników).
	ctx.fillStyle = primaryColor;
	ctx.fillRect(0, 0, width, borderThickness); // góra
	ctx.fillRect(0, height - borderThickness, width, borderThickness); // dół
	ctx.fillRect(0, 0, borderThickness, height); // lewo
	ctx.fillRect(width - borderThickness, 0, borderThickness, height); // prawo

	// Cienka linia akcentowa tuż wewnątrz grubej ramki.
	const accentLineWidth = Math.max(2, Math.round(borderThickness * 0.25));
	const inset = borderThickness + accentLineWidth / 2;
	ctx.strokeStyle = accentColor;
	ctx.lineWidth = accentLineWidth;
	ctx.strokeRect(
		inset,
		inset,
		Math.max(0, width - inset * 2),
		Math.max(0, height - inset * 2),
	);
}

/**
 * Rysuje dowolne źródło obrazu (HTMLVideoElement, HTMLImageElement, ImageBitmap itp.)
 * na `<canvas>` o zadanych wymiarach źródłowych, skalując proporcjonalnie do `maxDimension`
 * i dokłada na wierzchu ramkę motywu wesela.
 */
export function captureSourceToCanvas(
	source: CanvasImageSource,
	sourceWidth: number,
	sourceHeight: number,
	canvas: HTMLCanvasElement,
	colors?: PhotoboothColors,
	maxDimension: number = MAX_CAPTURE_DIMENSION,
): CanvasSize {
	const { width, height } = computeCaptureDimensions(
		sourceWidth,
		sourceHeight,
		maxDimension,
	);

	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext("2d");
	if (!ctx) return { width, height };

	ctx.drawImage(source, 0, 0, width, height);
	drawPhotoboothFrame(ctx, width, height, colors);

	return { width, height };
}

/**
 * Rysuje bieżącą klatkę z `<video>` na `<canvas>` (dopasowując wymiary canvasu
 * do faktycznych wymiarów strumienia, patrz `computeCaptureDimensions`) i
 * dokłada na wierzchu ramkę motywu wesela.
 */
export function captureFrameToCanvas(
	video: HTMLVideoElement,
	canvas: HTMLCanvasElement,
	colors?: PhotoboothColors,
	maxDimension: number = MAX_CAPTURE_DIMENSION,
): CanvasSize {
	return captureSourceToCanvas(
		video,
		video.videoWidth,
		video.videoHeight,
		canvas,
		colors,
		maxDimension,
	);
}

/**
 * Eksportuje canvas jako `File` (JPEG, domyślnie jakość 0.95) gotowy do
 * przekazania do dokładnie tego samego `tus.Upload`, co plik z wyboru z dysku.
 */
export function canvasToJpegFile(
	canvas: HTMLCanvasElement,
	filename: string = `photobooth_${Date.now()}.jpg`,
	quality = 0.95,
): Promise<File> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error("Nie udało się wyeksportować zdjęcia z canvasu"));
					return;
				}
				resolve(new File([blob], filename, { type: "image/jpeg" }));
			},
			"image/jpeg",
			quality,
		);
	});
}

/**
 * Czy przeglądarka udostępnia `getUserMedia` (starsza przeglądarka / brak bezpiecznego
 * kontekstu => opcja „Zrób zdjęcie" jest niedostępna, zostaje zwykły wybór pliku).
 */
export function isCameraSupported(): boolean {
	return (
		typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
	);
}
