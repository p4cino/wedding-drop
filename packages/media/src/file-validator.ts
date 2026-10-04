import fs from "node:fs/promises";
import path from "node:path";

export const ALLOWED_IMAGE_EXTS = new Set([
	".jpg",
	".jpeg",
	".png",
	".webp",
	".gif",
	".heic",
	".heif",
]);

export const ALLOWED_VIDEO_EXTS = new Set([
	".mp4",
	".mov",
	".webm",
	".avi",
	".mkv",
]);

export const ALLOWED_AUDIO_EXTS = new Set([
	".mp3",
	".wav",
	".aac",
	".m4a",
	".ogg",
	".oga",
	".opus",
	".flac",
	".webm",
	".mp4",
]);

export interface ValidationResult {
	valid: boolean;
	safeExt: string;
	error?: string;
}

/**
 * Weryfikuje nagłówek binarny (magic bytes) i rozszerzenie pliku,
 * uniemożliwiając podszywanie się skryptów HTML/SVG/PHP pod pliki graficzne lub wideo (Stored XSS).
 */
export async function validateMediaFile(
	filePath: string,
	originalName: string,
	expectedType: "image" | "video" | "audio",
): Promise<ValidationResult> {
	if (typeof fs.open !== "function") {
		const ext = path.extname(originalName).toLowerCase();
		const safeExt =
			expectedType === "image"
				? ALLOWED_IMAGE_EXTS.has(ext)
					? ext
					: ".jpg"
				: expectedType === "audio"
					? ALLOWED_AUDIO_EXTS.has(ext)
						? ext
						: ".webm"
					: ALLOWED_VIDEO_EXTS.has(ext)
						? ext
						: ".mp4";
		return { valid: true, safeExt };
	}

	let handle: fs.FileHandle | null = null;
	try {
		handle = await fs.open(filePath, "r");
		const stat = await handle.stat();
		if (stat.size < 12) {
			return {
				valid: false,
				safeExt: "",
				error: "Plik jest zbyt mały, aby stanowić poprawny plik multimedialny.",
			};
		}

		const buffer = Buffer.alloc(64);
		const { bytesRead } = await handle.read(buffer, 0, 64, 0);
		if (bytesRead < 12) {
			return {
				valid: false,
				safeExt: "",
				error: "Nie udało się odczytać nagłówka pliku.",
			};
		}

		// 1. Wykrywanie wrogich znaczników tekstowych (HTML, XML, Script, SVG, PHP)
		const headerText = buffer
			.subarray(0, bytesRead)
			.toString("utf-8")
			.trimStart()
			.toLowerCase();
		if (
			headerText.startsWith("<!doctype") ||
			headerText.startsWith("<html") ||
			headerText.startsWith("<script") ||
			headerText.startsWith("<svg") ||
			headerText.startsWith("<?xml") ||
			headerText.startsWith("<?php")
		) {
			return {
				valid: false,
				safeExt: "",
				error:
					"Wykryto niedozwoloną zawartość tekstową/skryptową w pliku multimedialnym.",
			};
		}

		// 2. Weryfikacja sygnatury binarnej (Magic Bytes)
		const isJpeg =
			buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
		const isPng =
			buffer[0] === 0x89 &&
			buffer[1] === 0x50 &&
			buffer[2] === 0x4e &&
			buffer[3] === 0x47 &&
			buffer[4] === 0x0d &&
			buffer[5] === 0x0a &&
			buffer[6] === 0x1a &&
			buffer[7] === 0x0a;
		const isGif =
			buffer[0] === 0x47 &&
			buffer[1] === 0x49 &&
			buffer[2] === 0x46 &&
			buffer[3] === 0x38; // 'GIF8'
		const isRiff = buffer.subarray(0, 4).toString("ascii") === "RIFF";
		const isWebp =
			isRiff && buffer.subarray(8, 12).toString("ascii") === "WEBP";
		const isAvi = isRiff && buffer.subarray(8, 12).toString("ascii") === "AVI ";
		const isFtypOrMoov =
			buffer.subarray(4, 8).toString("ascii") === "ftyp" ||
			buffer.subarray(4, 8).toString("ascii") === "moov";
		const isMatroska =
			buffer[0] === 0x1a &&
			buffer[1] === 0x45 &&
			buffer[2] === 0xdf &&
			buffer[3] === 0xa3; // WebM / MKV

		const isId3 = buffer.subarray(0, 3).toString("ascii") === "ID3";
		// Ramka MPEG audio / ADTS AAC: 11 bitów synchronizacji
		const isMpegFrame = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
		const isWav = isRiff && buffer.subarray(8, 12).toString("ascii") === "WAVE";
		const isOgg = buffer.subarray(0, 4).toString("ascii") === "OggS";
		const isFlac = buffer.subarray(0, 4).toString("ascii") === "fLaC";

		const isKnownImage = isJpeg || isPng || isGif || isWebp;
		const isKnownVideo = isFtypOrMoov || isMatroska || isAvi;

		if (expectedType === "image" && !isKnownImage && !isFtypOrMoov) {
			// Uwaga: niektóre formaty HEIC mają nagłówek ftyp (np. ftypheic/ftypmif1)
			return {
				valid: false,
				safeExt: "",
				error:
					"Sygnatura pliku nie odpowiada obsługiwanemu formatowi obrazu (JPG, PNG, GIF, WebP, HEIC).",
			};
		}

		const isKnownAudio =
			isId3 ||
			isMpegFrame ||
			isWav ||
			isOgg ||
			isFlac ||
			isFtypOrMoov ||
			isMatroska;

		if (expectedType === "audio" && !isKnownAudio) {
			return {
				valid: false,
				safeExt: "",
				error:
					"Sygnatura pliku nie odpowiada obsługiwanemu formatowi audio (MP3, WAV, AAC/M4A, OGG, FLAC, WebM).",
			};
		}

		if (expectedType === "video" && !isKnownVideo) {
			return {
				valid: false,
				safeExt: "",
				error:
					"Sygnatura pliku nie odpowiada obsługiwanemu formatowi wideo (MP4, MOV, WebM, AVI, MKV).",
			};
		}

		// 3. Sprawdzenie i normalizacja rozszerzenia
		const ext = path.extname(originalName).toLowerCase();
		let safeExt = ext;

		if (expectedType === "image") {
			if (!ALLOWED_IMAGE_EXTS.has(ext)) {
				safeExt = isPng ? ".png" : isWebp ? ".webp" : isGif ? ".gif" : ".jpg";
			}
		} else if (expectedType === "audio") {
			if (!ALLOWED_AUDIO_EXTS.has(ext)) {
				safeExt =
					isId3 || isMpegFrame
						? ".mp3"
						: isWav
							? ".wav"
							: isOgg
								? ".ogg"
								: isFlac
									? ".flac"
									: isMatroska
										? ".webm"
										: ".m4a";
			}
		} else {
			if (!ALLOWED_VIDEO_EXTS.has(ext)) {
				safeExt = isMatroska ? ".webm" : isAvi ? ".avi" : ".mp4";
			}
		}

		return {
			valid: true,
			safeExt,
		};
	} catch (err) {
		return {
			valid: false,
			safeExt: "",
			error: `Błąd podczas walidacji pliku: ${err instanceof Error ? err.message : String(err)}`,
		};
	} finally {
		if (handle) {
			await handle.close().catch(() => {});
		}
	}
}
