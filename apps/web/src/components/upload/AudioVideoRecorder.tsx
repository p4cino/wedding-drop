"use client";

import { Mic, SwitchCamera, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";
import {
	buildRecordingFile,
	pickRecorderMimeType,
	type RecordingKind,
} from "@/lib/recorder-formats";

interface AudioVideoRecorderProps {
	onRecorded: (file: File) => void;
	maxDurationSeconds?: number;
	disabled?: boolean;
}

type Phase = "idle" | "recording" | "preview";

const tileButton = css({
	flex: "1",
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	gap: "2",
	p: "4",
	borderRadius: "xl",
	borderWidth: "1px",
	borderColor: "slate.200",
	backgroundColor: "white",
	fontSize: "sm",
	fontWeight: "semibold",
	color: "slate.800",
	cursor: "pointer",
	transition: "all 0.2s ease",
	_hover: { borderColor: "amber.400", backgroundColor: "amber.50" },
	_focusVisible: { outline: "2px solid", outlineColor: "amber.500" },
	_disabled: { opacity: 0.5, cursor: "not-allowed" },
});

const actionButton = css({
	flex: "1",
	p: "2.5",
	borderRadius: "lg",
	borderWidth: "1px",
	borderColor: "slate.300",
	backgroundColor: "white",
	fontSize: "sm",
	fontWeight: "semibold",
	cursor: "pointer",
	_hover: { backgroundColor: "slate.100" },
	_focusVisible: { outline: "2px solid", outlineColor: "amber.500" },
});

export default function AudioVideoRecorder({
	onRecorded,
	maxDurationSeconds = 60,
	disabled = false,
}: AudioVideoRecorderProps) {
	const t = useTranslations("GuestGallery");
	const [supported, setSupported] = useState<boolean | null>(null);
	const [phase, setPhase] = useState<Phase>("idle");
	const [kind, setKind] = useState<RecordingKind>("audio");
	const [facing, setFacing] = useState<"user" | "environment">("user");
	const [elapsed, setElapsed] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [recorded, setRecorded] = useState<{ file: File; url: string } | null>(
		null,
	);

	const recorderRef = useRef<MediaRecorder | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const liveVideoRef = useRef<HTMLVideoElement>(null);
	const audioFallbackRef = useRef<HTMLInputElement>(null);
	const videoFallbackRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setSupported(
			typeof MediaRecorder !== "undefined" &&
				!!navigator.mediaDevices?.getUserMedia,
		);
	}, []);

	const releaseStream = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		if (streamRef.current) {
			for (const track of streamRef.current.getTracks()) {
				track.stop();
			}
			streamRef.current = null;
		}
	}, []);

	// Zwalnia kamerę/mikrofon przy odmontowaniu
	useEffect(() => releaseStream, [releaseStream]);

	// Adres obiektu podglądu jest zwalniany przy zmianie nagrania i odmontowaniu
	useEffect(() => {
		const url = recorded?.url;
		return () => {
			if (url) URL.revokeObjectURL(url);
		};
	}, [recorded]);

	// Podgląd na żywo z kamery podczas nagrywania wideo
	useEffect(() => {
		if (phase === "recording" && kind === "video" && liveVideoRef.current) {
			liveVideoRef.current.srcObject = streamRef.current;
		}
	}, [phase, kind]);

	const start = async (nextKind: RecordingKind) => {
		setError(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia(
				nextKind === "audio"
					? { audio: true }
					: {
							audio: true,
							video: { facingMode: facing, width: { ideal: 1280 } },
						},
			);
			streamRef.current = stream;

			const mimeType = pickRecorderMimeType(nextKind, (m) =>
				MediaRecorder.isTypeSupported(m),
			);
			const recorder = new MediaRecorder(
				stream,
				mimeType ? { mimeType } : undefined,
			);
			const chunks: Blob[] = [];
			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunks.push(e.data);
			};
			recorder.onstop = () => {
				const file = buildRecordingFile(
					chunks,
					recorder.mimeType || mimeType || "",
					nextKind,
				);
				releaseStream();
				setRecorded({ file, url: URL.createObjectURL(file) });
				setPhase("preview");
			};

			recorderRef.current = recorder;
			setKind(nextKind);
			setElapsed(0);
			setPhase("recording");
			recorder.start();

			const startedAt = Date.now();
			timerRef.current = setInterval(() => {
				const seconds = Math.floor((Date.now() - startedAt) / 1000);
				setElapsed(Math.min(seconds, maxDurationSeconds));
				if (seconds >= maxDurationSeconds && recorder.state === "recording") {
					recorder.stop();
				}
			}, 250);
		} catch (err) {
			console.error("Błąd dostępu do urządzeń multimedialnych:", err);
			releaseStream();
			setPhase("idle");
			setError(t("recorderPermissionError"));
		}
	};

	const stop = () => {
		if (recorderRef.current?.state === "recording") {
			recorderRef.current.stop();
		}
	};

	const reset = () => {
		setRecorded(null);
		setPhase("idle");
		setElapsed(0);
	};

	const send = () => {
		if (!recorded) return;
		onRecorded(recorded.file);
		reset();
	};

	const handleFallbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.length) {
			for (const file of Array.from(e.target.files)) {
				onRecorded(file);
			}
		}
		e.target.value = "";
	};

	const header = (
		<div>
			<p
				className={css({
					fontSize: "xs",
					fontWeight: "semibold",
					textTransform: "uppercase",
					letterSpacing: "wider",
					color: "slate.600",
				})}
			>
				{t("recorderHeading")}
			</p>
			<p className={css({ fontSize: "xs", color: "slate.500", mt: "0.5" })}>
				{t("recorderHint", { max: maxDurationSeconds })}
			</p>
		</div>
	);

	if (supported === null) return null;

	if (!supported) {
		return (
			<div
				className={css({ display: "flex", flexDirection: "column", gap: "3" })}
			>
				{header}
				<div className={css({ display: "flex", gap: "3" })}>
					<button
						type="button"
						disabled={disabled}
						onClick={() => audioFallbackRef.current?.click()}
						className={tileButton}
					>
						<Mic className={css({ w: "5", h: "5" })} aria-hidden="true" />
						{t("recorderFallbackAudio")}
					</button>
					<button
						type="button"
						disabled={disabled}
						onClick={() => videoFallbackRef.current?.click()}
						className={tileButton}
					>
						<Video className={css({ w: "5", h: "5" })} aria-hidden="true" />
						{t("recorderFallbackVideo")}
					</button>
				</div>
				<input
					ref={audioFallbackRef}
					type="file"
					accept="audio/*"
					capture
					onChange={handleFallbackChange}
					className={css({ display: "none" })}
				/>
				<input
					ref={videoFallbackRef}
					type="file"
					accept="video/*"
					capture="user"
					onChange={handleFallbackChange}
					className={css({ display: "none" })}
				/>
			</div>
		);
	}

	return (
		<div
			className={css({ display: "flex", flexDirection: "column", gap: "3" })}
		>
			{phase === "idle" && (
				<>
					{header}
					<div className={css({ display: "flex", gap: "3" })}>
						<button
							type="button"
							disabled={disabled}
							onClick={() => start("audio")}
							className={tileButton}
						>
							<Mic className={css({ w: "5", h: "5" })} aria-hidden="true" />
							{t("recorderRecordAudio")}
						</button>
						<button
							type="button"
							disabled={disabled}
							onClick={() => start("video")}
							className={tileButton}
						>
							<Video className={css({ w: "5", h: "5" })} aria-hidden="true" />
							{t("recorderRecordVideo")}
						</button>
						<button
							type="button"
							disabled={disabled}
							onClick={() =>
								setFacing((f) => (f === "user" ? "environment" : "user"))
							}
							aria-label={t("cameraSwitchCamera")}
							title={t("cameraSwitchCamera")}
							className={css({
								alignSelf: "stretch",
								px: "3",
								borderRadius: "xl",
								borderWidth: "1px",
								borderColor: "slate.200",
								color: "slate.600",
								cursor: "pointer",
								_hover: { backgroundColor: "slate.100" },
								_disabled: { opacity: 0.5, cursor: "not-allowed" },
							})}
						>
							<SwitchCamera
								className={css({ w: "5", h: "5" })}
								aria-hidden="true"
							/>
						</button>
					</div>
				</>
			)}

			{phase === "recording" && (
				<div
					className={css({
						borderWidth: "2px",
						borderColor: "red.400",
						borderRadius: "xl",
						p: "4",
						backgroundColor: "red.50",
						display: "flex",
						flexDirection: "column",
						gap: "3",
					})}
				>
					{kind === "video" && (
						<video
							ref={liveVideoRef}
							muted
							playsInline
							autoPlay
							className={css({
								w: "full",
								maxH: "40vh",
								objectFit: "cover",
								borderRadius: "lg",
								backgroundColor: "black",
							})}
						/>
					)}
					<div
						className={css({
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						})}
					>
						<div role="status">
							<p className={css({ fontSize: "sm", fontWeight: "semibold" })}>
								{kind === "audio"
									? t("recorderRecordingAudio")
									: t("recorderRecordingVideo")}
							</p>
							<p className={css({ fontSize: "xs", color: "slate.600" })}>
								{t("recorderTimer", {
									current: elapsed,
									max: maxDurationSeconds,
								})}
							</p>
						</div>
						<button
							type="button"
							onClick={stop}
							aria-label={t("recorderStop")}
							title={t("recorderStop")}
							className={css({
								w: "10",
								h: "10",
								borderRadius: "full",
								backgroundColor: "red.600",
								cursor: "pointer",
								_hover: { backgroundColor: "red.700" },
								_focusVisible: {
									outline: "2px solid",
									outlineColor: "red.300",
								},
							})}
						>
							<span
								aria-hidden="true"
								className={css({
									display: "block",
									w: "3.5",
									h: "3.5",
									mx: "auto",
									backgroundColor: "white",
									borderRadius: "xs",
								})}
							/>
						</button>
					</div>
				</div>
			)}

			{phase === "preview" && recorded && (
				<div
					className={css({
						borderWidth: "1px",
						borderColor: "slate.200",
						borderRadius: "xl",
						p: "4",
						backgroundColor: "slate.50",
						display: "flex",
						flexDirection: "column",
						gap: "3",
					})}
				>
					<p className={css({ fontSize: "sm", fontWeight: "semibold" })}>
						{kind === "audio"
							? t("recorderPreviewAudio")
							: t("recorderPreviewVideo")}
					</p>
					{kind === "audio" ? (
						// biome-ignore lint/a11y/useMediaCaption: nagranie gościa, brak transkrypcji
						<audio src={recorded.url} controls className={css({ w: "full" })} />
					) : (
						// biome-ignore lint/a11y/useMediaCaption: nagranie gościa, brak transkrypcji
						<video
							src={recorded.url}
							controls
							playsInline
							className={css({
								w: "full",
								maxH: "40vh",
								objectFit: "cover",
								borderRadius: "lg",
								backgroundColor: "black",
							})}
						/>
					)}
					<div className={css({ display: "flex", gap: "2" })}>
						<button type="button" onClick={reset} className={actionButton}>
							{t("recorderRetake")}
						</button>
						<button
							type="button"
							onClick={send}
							className={css({
								flex: "1",
								p: "2.5",
								borderRadius: "lg",
								backgroundColor: "amber.600",
								color: "white",
								fontSize: "sm",
								fontWeight: "semibold",
								cursor: "pointer",
								_hover: { backgroundColor: "amber.700" },
								_focusVisible: {
									outline: "2px solid",
									outlineColor: "amber.300",
								},
							})}
						>
							{t("recorderSend")}
						</button>
					</div>
				</div>
			)}

			{error && (
				<p role="alert" className={css({ fontSize: "xs", color: "red.600" })}>
					{error}
				</p>
			)}
		</div>
	);
}
