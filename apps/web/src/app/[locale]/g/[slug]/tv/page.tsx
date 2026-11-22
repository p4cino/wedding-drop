"use client";

import { Heart } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useState } from "react";
import { css } from "styled-system/css";
import AudioPlaceholder from "@/components/AudioPlaceholder";
import GalleryStatusScreen from "@/components/GalleryStatusScreen";
import { useLiveGallery } from "@/hooks/useLiveGallery";
import type { LiveEvent } from "@/lib/live-gallery";
import {
	buildTvGalleryQrUrl,
	buildTvSlides,
	resolveTvQuestTitle,
} from "@/lib/tv-slideshow";

// Ustalony, stały interwał rotacji slajdów (nie konfigurowalny w tej iteracji — patrz design.md)
const ROTATION_INTERVAL_MS = 8000;
// Limit kolejki, by rotacja pozostała płynna nawet przy dużym napływie zdjęć naraz
const MAX_QUEUE_SIZE = 200;

export default function TvSlideshowPage() {
	const params = useParams();
	const slug = params?.slug as string;
	const t = useTranslations("TvSlideshow");
	const [currentIndex, setCurrentIndex] = useState(0);
	const [pendingSlideId, setPendingSlideId] = useState<string | null>(null);
	const [qrSvg, setQrSvg] = useState("");

	// Nowe zdjęcie lub życzenie natychmiast wskakuje na ekran
	const handleEvent = useCallback((event: LiveEvent) => {
		if (event.type === "new-media" && event.media) {
			setPendingSlideId(null);
			setCurrentIndex(0);
		} else if (event.type === "new-wish" && event.wish) {
			setPendingSlideId(`wish-${event.wish.id}`);
		} else if (event.type === "wish-updated" && event.update?.wishId) {
			const updatedId = `wish-${event.update.wishId}`;
			setPendingSlideId((curr) => (curr === updatedId ? null : curr));
		}
	}, []);

	// Ten sam publiczny stan i kanał SSE co galeria gościa (API już filtruje "ready")
	const { gallery, items, wishes, status, isLive, refetch } = useLiveGallery(
		slug,
		{
			maxItems: MAX_QUEUE_SIZE,
			withWishes: true,
			onEvent: handleEvent,
		},
	);

	const slides = useMemo(() => buildTvSlides(items, wishes), [items, wishes]);

	// Synchronizacja indeksu z nowo nadesłanym życzeniem (gdy pojawi się na liście slajdów)
	useEffect(() => {
		if (!pendingSlideId) return;
		const idx = slides.findIndex((slide) => slide.id === pendingSlideId);
		if (idx !== -1) {
			setCurrentIndex(idx);
			setPendingSlideId(null);
		}
	}, [slides, pendingSlideId]);

	// Rotacja slajdów po ustalonym interwale
	useEffect(() => {
		if (slides.length <= 1) return;
		const interval = setInterval(() => {
			setCurrentIndex((curr) => (curr + 1) % slides.length);
		}, ROTATION_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [slides.length]);

	// Zabezpieczenie indeksu, gdy lista slajdów się skurczy (np. po ukryciu/usunięciu)
	useEffect(() => {
		setCurrentIndex((curr) => {
			if (slides.length === 0) return 0;
			return curr % slides.length;
		});
	}, [slides.length]);

	// Wygenerowanie kodu QR po stronie klienta prowadzącego do galerii gościa
	useEffect(() => {
		if (!slug) return;
		const url = buildTvGalleryQrUrl(slug);
		QRCode.toString(url, {
			type: "svg",
			margin: 1,
			color: { dark: "#0F172A", light: "#FFFFFF" },
			errorCorrectionLevel: "H",
		})
			.then(setQrSvg)
			.catch((err) => console.error("Błąd generowania kodu QR:", err));
	}, [slug]);

	if (status === "loading") {
		return <GalleryStatusScreen variant="loading" dark />;
	}
	if (status === "notFound") {
		return <GalleryStatusScreen variant="notFound" dark />;
	}
	if (status === "error" || !gallery) {
		return <GalleryStatusScreen variant="error" dark onRetry={refetch} />;
	}

	const pendingIndex = pendingSlideId
		? slides.findIndex((slide) => slide.id === pendingSlideId)
		: -1;
	const effectiveIndex =
		pendingIndex !== -1
			? pendingIndex
			: slides.length > 0
				? currentIndex % slides.length
				: 0;
	const currentSlide = slides[effectiveIndex] ?? null;
	const currentMedia =
		currentSlide?.kind === "media" ? currentSlide.media : null;
	const currentQuestTitle = currentMedia
		? resolveTvQuestTitle(gallery.questsConfig, currentMedia.questId)
		: null;
	const currentLikesCount = currentMedia?.likesCount ?? 0;
	const showMediaOverlay = Boolean(
		currentMedia &&
			(currentMedia.uploaderName ||
				currentMedia.caption ||
				currentQuestTitle ||
				currentLikesCount > 0),
	);

	return (
		<div
			className={css({
				position: "fixed",
				inset: "0",
				backgroundColor: "black",
				overflow: "hidden",
				userSelect: "none",
			})}
		>
			{/* Prezentowany slajd: zdjęcie/wideo/audio lub pełnoekranowa karta z Księgi Życzeń */}
			{currentSlide ? (
				currentSlide.kind === "wish" ? (
					<div
						key={currentSlide.id}
						data-testid="tv-wish-slide"
						className={css({
							position: "absolute",
							inset: "0",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							px: { base: "6", md: "20" },
							py: "24",
							background:
								"radial-gradient(circle at center, rgba(30, 41, 59, 0.92) 0%, rgba(2, 6, 23, 0.98) 100%)",
						})}
					>
						<div
							className={css({
								maxW: "4xl",
								w: "full",
								textAlign: "center",
								px: { base: "8", md: "14" },
								py: { base: "10", md: "14" },
								borderRadius: "3xl",
								border: "1px solid rgba(212, 175, 55, 0.45)",
								backgroundColor: "rgba(15, 23, 42, 0.75)",
								backdropFilter: "blur(12px)",
								boxShadow: "2xl",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: "6",
							})}
						>
							<span
								data-testid="tv-wish-badge"
								className={css({
									display: "inline-flex",
									alignItems: "center",
									gap: "2",
									px: "4",
									py: "1.5",
									borderRadius: "full",
									backgroundColor: "rgba(212, 175, 55, 0.18)",
									border: "1px solid rgba(212, 175, 55, 0.5)",
									color: "wedding.gold",
									fontSize: "xs",
									fontWeight: "semibold",
									letterSpacing: "wider",
									textTransform: "uppercase",
								})}
							>
								<Heart
									aria-hidden="true"
									className={css({
										w: "3.5",
										h: "3.5",
										color: "wedding.gold",
									})}
								/>
								<span>{t("wishBadge")}</span>
							</span>

							<blockquote
								data-testid="tv-wish-message"
								className={css({
									fontFamily: "serif",
									fontSize: { base: "2xl", md: "4xl" },
									lineHeight: "relaxed",
									color: "white",
									fontStyle: "italic",
									wordBreak: "break-word",
								})}
							>
								{currentSlide.wish.message}
							</blockquote>

							<p
								data-testid="tv-wish-author"
								className={css({
									fontSize: { base: "base", md: "lg" },
									fontWeight: "medium",
									color: "wedding.gold",
								})}
							>
								<span aria-hidden="true">— </span>
								<span>
									{currentSlide.wish.guestName?.trim() ||
										t("wishAuthorFallback")}
								</span>
							</p>
						</div>
					</div>
				) : currentSlide.media.fileType === "audio" ? (
					<div
						key={currentSlide.id}
						className={css({ position: "absolute", inset: "0" })}
					>
						<AudioPlaceholder />
					</div>
				) : (
					<img
						key={currentSlide.id}
						src={
							currentSlide.media.fileType === "video"
								? currentSlide.media.thumbUrl
								: currentSlide.media.rawUrl
						}
						alt=""
						className={css({
							position: "absolute",
							inset: "0",
							w: "full",
							h: "full",
							objectFit: "contain",
						})}
					/>
				)
			) : (
				<div
					className={css({
						position: "absolute",
						inset: "0",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					})}
				>
					<div
						className={css({
							textAlign: "center",
							display: "flex",
							flexDirection: "column",
							gap: "3",
						})}
					>
						<Heart
							className={css({
								w: "14",
								h: "14",
								color: "wedding.gold",
								animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
								mx: "auto",
							})}
						/>
						<p
							className={css({
								fontFamily: "serif",
								fontSize: "2xl",
								color: "white",
							})}
						>
							{t("waitingForFirstPhoto")}
						</p>
					</div>
				</div>
			)}

			{/* Nagłówek: imiona pary młodej i status na żywo */}
			<div
				className={css({
					position: "absolute",
					top: "8",
					left: "8",
					display: "flex",
					alignItems: "center",
					gap: "3",
				})}
			>
				<span
					className={css({
						fontFamily: "serif",
						fontSize: { base: "2xl", md: "3xl" },
						fontWeight: "bold",
						color: "white",
						filter: "drop-shadow(0 10px 8px rgba(0, 0, 0, 0.4))",
					})}
				>
					{gallery.coupleNames}
				</span>
				<span
					role="status"
					aria-live="polite"
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "1.5",
						px: "3",
						py: "1",
						borderRadius: "full",
						backgroundColor: "rgba(0, 0, 0, 0.4)",
						backdropFilter: "blur(4px)",
						fontSize: "xs",
						color: "white",
					})}
				>
					<span
						className={css({
							w: "2",
							h: "2",
							borderRadius: "full",
							backgroundColor: isLive ? "emerald.400" : "slate.400",
							animation: isLive
								? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
								: undefined,
						})}
						aria-hidden="true"
					/>
					<span>{isLive ? t("live") : t("offline")}</span>
				</span>
			</div>

			{/* Karta metadanych bieżącego zdjęcia: wyzwanie, serduszka, podpis oraz autor */}
			{showMediaOverlay && currentMedia && (
				<div
					data-testid="tv-media-overlay"
					className={css({
						position: "absolute",
						bottom: "8",
						left: "8",
						px: "5",
						py: "3",
						borderRadius: "2xl",
						backgroundColor: "rgba(0, 0, 0, 0.55)",
						backdropFilter: "blur(8px)",
						color: "white",
						maxW: "60%",
						display: "flex",
						flexDirection: "column",
						gap: "1.5",
					})}
				>
					{(currentQuestTitle || currentLikesCount > 0) && (
						<div
							className={css({
								display: "flex",
								flexWrap: "wrap",
								alignItems: "center",
								gap: "2",
							})}
						>
							{currentQuestTitle && (
								<span
									data-testid="tv-quest-badge"
									className={css({
										display: "inline-flex",
										alignItems: "center",
										gap: "1",
										px: "2.5",
										py: "0.5",
										borderRadius: "full",
										backgroundColor: "rgba(212, 175, 55, 0.25)",
										border: "1px solid rgba(212, 175, 55, 0.5)",
										color: "wedding.gold",
										fontSize: "xs",
										fontWeight: "semibold",
									})}
								>
									<span aria-hidden="true">🎯 </span>
									<span>{currentQuestTitle}</span>
								</span>
							)}
							{currentLikesCount > 0 && (
								<span
									data-testid="tv-likes-badge"
									className={css({
										display: "inline-flex",
										alignItems: "center",
										gap: "1",
										px: "2.5",
										py: "0.5",
										borderRadius: "full",
										backgroundColor: "rgba(244, 63, 94, 0.25)",
										border: "1px solid rgba(244, 63, 94, 0.5)",
										color: "white",
										fontSize: "xs",
										fontWeight: "semibold",
									})}
								>
									<Heart
										aria-hidden="true"
										className={css({
											w: "3.5",
											h: "3.5",
											color: "rose.400",
											fill: "currentColor",
										})}
									/>
									<span>{currentLikesCount}</span>
								</span>
							)}
						</div>
					)}

					{currentMedia.caption && (
						<p
							data-testid="tv-media-caption"
							className={css({
								fontFamily: "serif",
								fontStyle: "italic",
								fontSize: { base: "base", md: "lg" },
								color: "white",
								lineClamp: 2,
								overflow: "hidden",
							})}
						>
							{currentMedia.caption}
						</p>
					)}

					{currentMedia.uploaderName && (
						<div
							className={css({
								fontSize: "sm",
								color: "slate.200",
							})}
						>
							{t("uploaderPrefix")} {currentMedia.uploaderName}
						</div>
					)}
				</div>
			)}

			{/* Stały kod QR do dołączenia — widoczny niezależnie od aktualnego slajdu */}
			<div
				className={css({
					position: "absolute",
					bottom: "8",
					right: "8",
					backgroundColor: "white",
					borderRadius: "2xl",
					p: "4",
					boxShadow: "2xl",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "2",
					w: "170px",
				})}
			>
				{qrSvg && (
					<div
						className={css({
							w: "32",
							h: "32",
							"& > svg": { w: "full", h: "full" },
						})}
						// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG generowany lokalnie przez zaufaną bibliotekę `qrcode` na podstawie sluga, brak danych od użytkownika
						dangerouslySetInnerHTML={{ __html: qrSvg }}
					/>
				)}
				<p
					className={css({
						fontSize: "11px",
						fontWeight: "semibold",
						color: "wedding.slate",
						textAlign: "center",
						lineHeight: "tight",
					})}
				>
					{t("qrHint")}
				</p>
			</div>
		</div>
	);
}
