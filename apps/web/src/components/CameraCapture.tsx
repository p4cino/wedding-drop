"use client";

import { Camera, SwitchCamera, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	canvasToJpegFile,
	captureFrameToCanvas,
	captureSourceToCanvas,
	isCameraSupported,
} from "@/lib/photobooth";

const CAMERA_FACING_STORAGE_KEY = "wedding_drop_camera_facing";
type FacingMode = "user" | "environment";

interface CameraCaptureProps {
	// Kolory motywu wesela dla dekoracyjnej ramki — brak wartości oznacza użycie
	// domyślnych kolorów generatora winietek (patrz `@/lib/photobooth`).
	primaryColor?: string | null;
	accentColor?: string | null;
	disabled?: boolean;
	onCapture: (file: File) => void;
	onCancel: () => void;
}

type CameraStatus = "starting" | "ready" | "error";

/**
 * Podgląd na żywo z kamery urządzenia gościa (`getUserMedia`) używany wewnątrz
 * `UploaderDrawer` jako alternatywa dla wyboru pliku z dysku. Umożliwia przełączanie
 * między przednim aparatem (selfie) a aparatem głównym (tylnym), komponuje klatkę
 * na `<canvas>` z opcjonalną ramką motywu wesela i eksportuje jako zwykły `File` (JPEG).
 */
export default function CameraCapture({
	primaryColor,
	accentColor,
	disabled,
	onCapture,
	onCancel,
}: CameraCaptureProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [status, setStatus] = useState<CameraStatus>("starting");
	const [isCapturing, setIsCapturing] = useState(false);
	const [facingMode, setFacingMode] = useState<FacingMode>(() => {
		if (typeof window !== "undefined") {
			try {
				const saved = localStorage.getItem(CAMERA_FACING_STORAGE_KEY);
				if (saved === "user" || saved === "environment") {
					return saved;
				}
			} catch {
				// Dostęp do localStorage może być zablokowany w restrykcyjnych politykach
			}
		}
		return "environment";
	});
	const [canSwitchCamera, setCanSwitchCamera] = useState(false);
	const t = useTranslations("GuestGallery");

	const stopStream = useCallback(() => {
		for (const track of streamRef.current?.getTracks() ?? []) {
			track.stop();
		}
		streamRef.current = null;
	}, []);

	useEffect(() => {
		let cancelled = false;
		setStatus("starting");

		async function startCamera() {
			if (!isCameraSupported()) {
				if (!cancelled) setStatus("error");
				return;
			}

			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: { ideal: facingMode },
						width: { ideal: 1920 },
						height: { ideal: 1080 },
					},
					audio: false,
				});

				if (cancelled) {
					for (const track of stream.getTracks()) track.stop();
					return;
				}

				streamRef.current = stream;
				const [track] = stream.getVideoTracks();
				if (track) {
					try {
						const capabilities = (track.getCapabilities?.() ?? {}) as {
							focusMode?: string[];
						};
						if (capabilities.focusMode?.includes("continuous")) {
							await track.applyConstraints?.({
								advanced: [
									{ focusMode: "continuous" } as MediaTrackConstraintSet,
								],
							});
						}
					} catch {
						// Ignorujemy brak wsparcia dla applyConstraints / focusMode
					}
				}

				const video = videoRef.current;
				if (video) {
					try {
						video.srcObject = stream;
						await video.play();
					} catch {
						// Odrzucone odtwarzanie (np. polityka autoplay) nie blokuje podglądu
					}
				}
				if (!cancelled) {
					setStatus("ready");
				}

				if (navigator.mediaDevices?.enumerateDevices) {
					try {
						const devices = await navigator.mediaDevices.enumerateDevices();
						const videoInputs = devices.filter((d) => d.kind === "videoinput");
						if (!cancelled) {
							setCanSwitchCamera(videoInputs.length > 1);
						}
					} catch {
						// Błąd enumerateDevices nie blokuje działania podglądu
					}
				}
			} catch (err) {
				// Odmowa dostępu (NotAllowedError) lub brak kamery (NotFoundError) —
				// pokazujemy czytelny komunikat, reszta drawera zostaje odblokowana.
				console.error("Nie udało się uruchomić kamery:", err);
				if (!cancelled) setStatus("error");
			}
		}

		startCamera();

		return () => {
			cancelled = true;
			stopStream();
		};
	}, [stopStream, facingMode]);

	const handleToggleCamera = useCallback(() => {
		if (status !== "ready") return;
		const nextFacing: FacingMode =
			facingMode === "user" ? "environment" : "user";
		setFacingMode(nextFacing);
		try {
			localStorage.setItem(CAMERA_FACING_STORAGE_KEY, nextFacing);
		} catch {
			// localStorage niedostępne
		}
	}, [facingMode, status]);

	const handleShutter = async () => {
		const video = videoRef.current;
		const canvas = canvasRef.current;
		if (!video || !canvas || isCapturing || status !== "ready") return;

		setIsCapturing(true);
		try {
			let capturedViaImageCapture = false;

			// Próba natywnego przechwycenia pełnej klatki sensora za pomocą ImageCapture API (Chromium / Android)
			if (typeof window !== "undefined" && "ImageCapture" in window) {
				const track = streamRef.current?.getVideoTracks()[0];
				if (track && track.readyState === "live") {
					try {
						const ImageCaptureConstructor = (
							window as unknown as {
								ImageCapture: new (
									t: MediaStreamTrack,
								) => {
									takePhoto: () => Promise<Blob>;
								};
							}
						).ImageCapture;
						const imageCapture = new ImageCaptureConstructor(track);
						const blob: Blob = await imageCapture.takePhoto();

						if (typeof createImageBitmap === "function") {
							const bitmap = await createImageBitmap(blob);
							try {
								captureSourceToCanvas(
									bitmap,
									bitmap.width,
									bitmap.height,
									canvas,
									{ primaryColor, accentColor },
								);
								capturedViaImageCapture = true;
							} finally {
								bitmap.close?.();
							}
						} else {
							const img = new Image();
							const url = URL.createObjectURL(blob);
							await new Promise<void>((resolve, reject) => {
								img.onload = () => resolve();
								img.onerror = reject;
								img.src = url;
							});
							URL.revokeObjectURL(url);
							captureSourceToCanvas(
								img,
								img.naturalWidth,
								img.naturalHeight,
								canvas,
								{ primaryColor, accentColor },
							);
							capturedViaImageCapture = true;
						}
					} catch (imageCaptureErr) {
						console.warn(
							"ImageCapture.takePhoto nie powiodło się, przełączam na zrzut z video:",
							imageCaptureErr,
						);
					}
				}
			}

			// Niezawodny fallback: zrzut z wysokorozdzielczego elementu <video> (Full HD)
			if (!capturedViaImageCapture) {
				captureFrameToCanvas(video, canvas, {
					primaryColor,
					accentColor,
				});
			}

			const file = await canvasToJpegFile(
				canvas,
				`photobooth_${Date.now()}.jpg`,
				0.95,
			);
			onCapture(file);
		} catch (err) {
			console.error("Nie udało się zrobić zdjęcia w przeglądarce:", err);
			// Kamera nie może świecić na ekranie błędu — zatrzymujemy strumień od razu
			stopStream();
			setStatus("error");
		} finally {
			setIsCapturing(false);
		}
	};

	if (status === "error") {
		return (
			<div
				role="alert"
				className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center space-y-3"
			>
				<p className="text-sm text-red-700 font-medium">{t("cameraError")}</p>
				<button
					type="button"
					onClick={onCancel}
					className="text-xs font-semibold text-red-700 underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none rounded"
				>
					{t("cameraBackToFiles")}
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-[4/3]">
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted
					className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
					data-testid="camera-preview-video"
				/>

				{status === "starting" && (
					<div className="absolute inset-0 flex items-center justify-center text-white text-sm bg-slate-900/60">
						{t("cameraStarting")}
					</div>
				)}

				<div className="absolute top-2 right-2 flex items-center gap-1.5">
					{canSwitchCamera && (
						<button
							type="button"
							onClick={handleToggleCamera}
							disabled={status !== "ready"}
							aria-label={t("cameraSwitchCamera")}
							title={t("cameraSwitchCamera")}
							className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
						>
							<SwitchCamera className="w-4 h-4" aria-hidden="true" />
						</button>
					)}
					<button
						type="button"
						onClick={onCancel}
						aria-label={t("cameraCancel")}
						title={t("cameraCancel")}
						className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
					>
						<X className="w-4 h-4" aria-hidden="true" />
					</button>
				</div>
			</div>

			{/* Ukryty canvas roboczy — kompozycja klatki + ramki motywu przed eksportem do pliku */}
			<canvas
				ref={canvasRef}
				className="hidden"
				data-testid="photobooth-canvas"
			/>

			<button
				type="button"
				onClick={handleShutter}
				disabled={status !== "ready" || disabled || isCapturing}
				aria-label={t("cameraShutter")}
				className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-2xl font-semibold shadow-lg shadow-amber-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
			>
				<Camera className="w-5 h-5" aria-hidden="true" />
				{t("cameraShutter")}
			</button>
		</div>
	);
}
