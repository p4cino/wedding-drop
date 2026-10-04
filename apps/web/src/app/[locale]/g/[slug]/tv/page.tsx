"use client";

import { Heart } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";
import { css } from "styled-system/css";
import AudioPlaceholder from "@/components/AudioPlaceholder";
import GalleryStatusScreen from "@/components/GalleryStatusScreen";
import { useLiveGallery } from "@/hooks/useLiveGallery";
import type { LiveEvent } from "@/lib/live-gallery";
import { buildTvGalleryQrUrl } from "@/lib/tv-slideshow";

// Ustalony, stały interwał rotacji slajdów (nie konfigurowalny w tej iteracji — patrz design.md)
const ROTATION_INTERVAL_MS = 8000;
// Limit kolejki, by rotacja pozostała płynna nawet przy dużym napływie zdjęć naraz
const MAX_QUEUE_SIZE = 200;

export default function TvSlideshowPage() {
	const params = useParams();
	const slug = params?.slug as string;
	const t = useTranslations("TvSlideshow");
	const [currentIndex, setCurrentIndex] = useState(0);
	const [qrSvg, setQrSvg] = useState("");

	// Nowe zdjęcie natychmiast wskakuje na wierzch rotacji
	const handleEvent = useCallback((event: LiveEvent) => {
		if (event.type === "new-media" && event.media) setCurrentIndex(0);
	}, []);

	// Ten sam publiczny stan i kanał SSE co galeria gościa (API już filtruje "ready")
	const { gallery, items, status, isLive, refetch } = useLiveGallery(slug, {
		maxItems: MAX_QUEUE_SIZE,
		withWishes: false,
		onEvent: handleEvent,
	});

	// Rotacja slajdów po ustalonym interwale
	useEffect(() => {
		if (items.length <= 1) return;
		const interval = setInterval(() => {
			setCurrentIndex((curr) => (curr + 1) % items.length);
		}, ROTATION_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [items.length]);

	// Zabezpieczenie indeksu, gdy lista mediów się skurczy (np. po ukryciu/usunięciu)
	useEffect(() => {
		setCurrentIndex((curr) => {
			if (items.length === 0) return 0;
			return curr % items.length;
		});
	}, [items.length]);

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

	const current = items[currentIndex] ?? null;

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
			{/* Prezentowany materiał — dla wideo pokazujemy statyczną miniaturę bez dźwięku (zob. design.md) */}
			{current ? (
				current.fileType === "audio" ? (
					<div
						key={current.id}
						className={css({ position: "absolute", inset: "0" })}
					>
						<AudioPlaceholder />
					</div>
				) : (
					<img
						key={current.id}
						src={
							current.fileType === "video" ? current.thumbUrl : current.rawUrl
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

			{/* Podpis autora bieżącego zdjęcia */}
			{current?.uploaderName && (
				<div
					className={css({
						position: "absolute",
						bottom: "8",
						left: "8",
						px: "4",
						py: "2",
						borderRadius: "xl",
						backgroundColor: "rgba(0, 0, 0, 0.4)",
						backdropFilter: "blur(4px)",
						color: "white",
						fontSize: "sm",
						maxW: "60%",
					})}
				>
					{t("uploaderPrefix")} {current.uploaderName}
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
