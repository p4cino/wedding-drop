"use client";

import { Heart } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";
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
		<div className="fixed inset-0 bg-black overflow-hidden select-none">
			{/* Prezentowany materiał — dla wideo pokazujemy statyczną miniaturę bez dźwięku (zob. design.md) */}
			{current ? (
				<img
					key={current.id}
					src={current.fileType === "video" ? current.thumbUrl : current.rawUrl}
					alt=""
					className="absolute inset-0 w-full h-full object-contain"
				/>
			) : (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="text-center space-y-3">
						<Heart className="w-14 h-14 text-amber-500 animate-pulse mx-auto" />
						<p className="font-serif-luxury text-2xl text-white">
							{t("waitingForFirstPhoto")}
						</p>
					</div>
				</div>
			)}

			{/* Nagłówek: imiona pary młodej i status na żywo */}
			<div className="absolute top-8 left-8 flex items-center gap-3">
				<span className="font-serif-luxury text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
					{gallery.coupleNames}
				</span>
				<span
					role="status"
					aria-live="polite"
					className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm text-xs text-white"
				>
					<span
						className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`}
						aria-hidden="true"
					/>
					<span>{isLive ? t("live") : t("offline")}</span>
				</span>
			</div>

			{/* Podpis autora bieżącego zdjęcia */}
			{current?.uploaderName && (
				<div className="absolute bottom-8 left-8 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-sm text-white text-sm max-w-[60%]">
					{t("uploaderPrefix")} {current.uploaderName}
				</div>
			)}

			{/* Stały kod QR do dołączenia — widoczny niezależnie od aktualnego slajdu */}
			<div className="absolute bottom-8 right-8 bg-white rounded-2xl p-4 shadow-2xl flex flex-col items-center gap-2 w-[170px]">
				{qrSvg && (
					<div
						className="w-32 h-32 [&>svg]:w-full [&>svg]:h-full"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG generowany lokalnie przez zaufaną bibliotekę `qrcode` na podstawie sluga, brak danych od użytkownika
						dangerouslySetInnerHTML={{ __html: qrSvg }}
					/>
				)}
				<p className="text-[11px] font-semibold text-slate-800 text-center leading-tight">
					{t("qrHint")}
				</p>
			</div>
		</div>
	);
}
