"use client";

import { Mic, Play, Square, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";

interface AudioVideoRecorderProps {
	onRecordingComplete: (blob: Blob, type: "audio" | "video") => void;
	maxDurationSeconds?: number;
	disabled?: boolean;
}

export default function AudioVideoRecorder({
	onRecordingComplete,
	maxDurationSeconds = 60,
	disabled = false,
}: AudioVideoRecorderProps) {
	const [mode, setMode] = useState<"idle" | "audio" | "video" | "preview">(
		"idle",
	);
	const [isRecording, setIsRecording] = useState(false);
	const [recordingTime, setRecordingTime] = useState(0);
	const [mediaType, setMediaType] = useState<"audio" | "video" | null>(null);
	const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const streamRef = useRef<MediaStream | null>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const videoPreviewRef = useRef<HTMLVideoElement>(null);
	const audioPreviewRef = useRef<HTMLAudioElement>(null);

	const getMediaTypeString = () => {
		if (mediaType === "audio") {
			return "audio/webm;codecs=opus";
		}
		return "video/webm;codecs=h264";
	};

	const startRecording = async (recordingType: "audio" | "video") => {
		try {
			chunksRef.current = [];
			const constraints =
				recordingType === "audio"
					? { audio: true }
					: {
							audio: true,
							video: { facingMode: "environment", width: { ideal: 1280 } },
						};

			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			streamRef.current = stream;

			const mimeType = getMediaTypeString();
			const options = MediaRecorder.isTypeSupported(mimeType)
				? { mimeType }
				: {};

			const recorder = new MediaRecorder(stream, options);
			mediaRecorderRef.current = recorder;
			setMediaType(recordingType);
			setRecordingTime(0);

			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) {
					chunksRef.current.push(e.data);
				}
			};

			recorder.onstop = () => {
				const blob = new Blob(chunksRef.current, {
					type: recordingType === "audio" ? "audio/webm" : "video/webm",
				});
				setPreviewBlob(blob);
				setMode("preview");

				for (const track of stream.getTracks()) {
					track.stop();
				}
				streamRef.current = null;
			};

			recorder.start();
			setIsRecording(true);
			setMode(recordingType);

			// Timer
			timerRef.current = setInterval(() => {
				setRecordingTime((t) => {
					const newTime = t + 1;
					if (newTime >= maxDurationSeconds) {
						recorder.stop();
						setIsRecording(false);
						if (timerRef.current) clearInterval(timerRef.current);
						return newTime;
					}
					return newTime;
				});
			}, 1000);
		} catch (err) {
			console.error("Error accessing media devices:", err);
			alert("Nie mógł uzyskać dostępu do urządzenia. Sprawdź uprawnienia.");
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
			if (timerRef.current) clearInterval(timerRef.current);
		}
	};

	const playPreview = () => {
		if (mediaType === "audio" && audioPreviewRef.current && previewBlob) {
			const url = URL.createObjectURL(previewBlob);
			audioPreviewRef.current.src = url;
			audioPreviewRef.current.play();
		} else if (
			mediaType === "video" &&
			videoPreviewRef.current &&
			previewBlob
		) {
			const url = URL.createObjectURL(previewBlob);
			videoPreviewRef.current.src = url;
			videoPreviewRef.current.play();
		}
	};

	const submitRecording = () => {
		if (previewBlob && mediaType) {
			onRecordingComplete(previewBlob, mediaType);
			setMode("idle");
			setPreviewBlob(null);
			setMediaType(null);
		}
	};

	const cancelRecording = () => {
		setMode("idle");
		setPreviewBlob(null);
		setMediaType(null);
		if (streamRef.current) {
			for (const track of streamRef.current.getTracks()) {
				track.stop();
			}
			streamRef.current = null;
		}
	};

	useEffect(() => {
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
			if (streamRef.current) {
				for (const track of streamRef.current.getTracks()) {
					track.stop();
				}
			}
		};
	}, []);

	// Idle state
	if (mode === "idle") {
		return (
			<div className={css({ display: "flex", gap: "3", mb: "4" })}>
				<button
					type="button"
					disabled={disabled}
					onClick={() => startRecording("audio")}
					className={`group ${css({
						flex: 1,
						p: "4",
						borderRadius: "lg",
						borderWidth: "1px",
						borderColor: "slate.300",
						backgroundColor: "white",
						cursor: "pointer",
						transition: "all 0.2s ease",
						_hover: {
							borderColor: "blue.400",
							backgroundColor: "blue.50",
						},
						_disabled: { opacity: 0.5, cursor: "not-allowed" },
					})}`}
				>
					<Mic className={css({ w: "5", h: "5", mx: "auto", mb: "2" })} />
					<p className={css({ fontSize: "sm", fontWeight: "semibold" })}>
						Nagrać audio
					</p>
				</button>
				<button
					type="button"
					disabled={disabled}
					onClick={() => startRecording("video")}
					className={`group ${css({
						flex: 1,
						p: "4",
						borderRadius: "lg",
						borderWidth: "1px",
						borderColor: "slate.300",
						backgroundColor: "white",
						cursor: "pointer",
						transition: "all 0.2s ease",
						_hover: {
							borderColor: "green.400",
							backgroundColor: "green.50",
						},
						_disabled: { opacity: 0.5, cursor: "not-allowed" },
					})}`}
				>
					<VideoOff className={css({ w: "5", h: "5", mx: "auto", mb: "2" })} />
					<p className={css({ fontSize: "sm", fontWeight: "semibold" })}>
						Nagrać wideo
					</p>
				</button>
			</div>
		);
	}

	// Recording state
	if (mode === "audio" || mode === "video") {
		return (
			<div
				className={css({
					borderWidth: "2px",
					borderColor: "red.400",
					borderRadius: "lg",
					p: "4",
					mb: "4",
					backgroundColor: "red.50",
				})}
			>
				<div
					className={css({ display: "flex", justifyContent: "space-between" })}
				>
					<div>
						<p className={css({ fontSize: "sm", fontWeight: "semibold" })}>
							{mode === "audio" ? "Nagrywanie audio" : "Nagrywanie wideo"}
						</p>
						<p className={css({ fontSize: "xs", color: "slate.600", mt: "1" })}>
							{recordingTime}s / {maxDurationSeconds}s
						</p>
					</div>
					<button
						type="button"
						onClick={stopRecording}
						className={css({
							p: "2",
							borderRadius: "md",
							backgroundColor: "red.600",
							color: "white",
							cursor: "pointer",
							_hover: { backgroundColor: "red.700" },
						})}
					>
						<Square className={css({ w: "4", h: "4" })} />
					</button>
				</div>
			</div>
		);
	}

	// Preview state
	if (mode === "preview" && previewBlob) {
		return (
			<div
				className={css({
					borderWidth: "1px",
					borderColor: "slate.300",
					borderRadius: "lg",
					p: "4",
					mb: "4",
					backgroundColor: "slate.50",
				})}
			>
				<p className={css({ fontSize: "sm", fontWeight: "semibold", mb: "3" })}>
					{mediaType === "audio" ? "Podgląd audio" : "Podgląd wideo"}
				</p>

				{mediaType === "audio" ? (
					<audio
						ref={audioPreviewRef}
						controls
						className={css({ w: "full", mb: "3" })}
					/>
				) : (
					<video
						ref={videoPreviewRef}
						controls
						className={css({
							w: "full",
							mb: "3",
							borderRadius: "md",
							backgroundColor: "black",
						})}
					/>
				)}

				<div className={css({ display: "flex", gap: "2" })}>
					<button
						type="button"
						onClick={playPreview}
						className={css({
							flex: 1,
							p: "2",
							borderRadius: "md",
							backgroundColor: "blue.600",
							color: "white",
							cursor: "pointer",
							_hover: { backgroundColor: "blue.700" },
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "2",
						})}
					>
						<Play className={css({ w: "4", h: "4" })} />
						Odtwórz
					</button>
					<button
						type="button"
						onClick={cancelRecording}
						className={css({
							flex: 1,
							p: "2",
							borderRadius: "md",
							borderWidth: "1px",
							borderColor: "slate.300",
							backgroundColor: "white",
							cursor: "pointer",
							_hover: { backgroundColor: "slate.100" },
						})}
					>
						Ponów
					</button>
					<button
						type="button"
						onClick={submitRecording}
						className={css({
							flex: 1,
							p: "2",
							borderRadius: "md",
							backgroundColor: "green.600",
							color: "white",
							cursor: "pointer",
							_hover: { backgroundColor: "green.700" },
						})}
					>
						Wyślij
					</button>
				</div>
			</div>
		);
	}

	return null;
}
