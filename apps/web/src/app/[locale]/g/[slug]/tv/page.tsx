"use client";

import { Heart } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";
import type { MediaItemData } from "@/components/LightboxModal";
import { Link } from "@/i18n/routing";
import { buildTvGalleryQrUrl } from "@/lib/tv-slideshow";

// Ustalony, stały interwał rotacji slajdów (nie konfigurowalny w tej iteracji — patrz design.md)
const ROTATION_INTERVAL_MS = 8000;
// Limit kolejki, by rotacja pozostała płynna nawet przy dużym napływie zdjęć naraz
const MAX_QUEUE_SIZE = 200;

interface GalleryData {
	id: string;
	slug: string;
	coupleNames: string;
	weddingDate: string;
	isActive: boolean;
	allowGuestDownloads: boolean;
	allowVideos: boolean;
}

export default function TvSlideshowPage() {
	const params = useParams();
	const slug = params?.slug as string;
	const t = useTranslations("TvSlideshow");
	const tCommon = useTranslations("Common");

	const [gallery, setGallery] = useState<GalleryData | null>(null);
	const [notFound, setNotFound] = useState(false);
	const [items, setItems] = useState<MediaItemData[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [qrSvg, setQrSvg] = useState("");
	const [isLiveConnected, setIsLiveConnected] = useState(false);

	// Pobranie metadanych galerii i listy mediów (identycznie jak w galerii gościa,
	// ten sam publiczny endpoint, który już filtruje status "ready" bez poświadczeń)
	const fetchData = useCallback(async () => {
		try {
			const resGallery = await fetch(`/api/gallery/${slug}`);
			if (!resGallery.ok) {
				setNotFound(true);
				return;
			}
			const galData = await resGallery.json();
			setGallery(galData);

			const resMedia = await fetch(`/api/gallery/${slug}/media`);
			if (resMedia.ok) {
				const medData = await resMedia.json();
				setItems((medData.media || []).slice(0, MAX_QUEUE_SIZE));
			}
		} catch (err) {
			console.error("Błąd ładowania danych trybu TV:", err);
			setNotFound(true);
		}
	}, [slug]);

	useEffect(() => {
		if (!slug) return;
		fetchData();
	}, [slug, fetchData]);

	// Połączenie z kanałem Live SSE — dokładnie ten sam endpoint co galeria gościa
	useEffect(() => {
		if (!slug) return;
		const eventSource = new EventSource(`/api/gallery/${slug}/live`);

		eventSource.onopen = () => {
			setIsLiveConnected(true);
		};

		eventSource.onmessage = (e) => {
			try {
				const data = JSON.parse(e.data);
				if (data.type === "new-media" && data.media) {
					setItems((prev) => {
						if (prev.some((item) => item.id === data.media.id)) return prev;
						return [data.media, ...prev].slice(0, MAX_QUEUE_SIZE);
					});
					// Nowe zdjęcie natychmiast wskakuje na wierzch rotacji
					setCurrentIndex(0);
				} else if (data.type === "media-updated" && data.update) {
					const { mediaId, status } = data.update;
					if (status === "hidden" || status === "deleted") {
						setItems((prev) => prev.filter((item) => item.id !== mediaId));
					}
				}
			} catch (_err) {
				// Ping lub cichy błąd parsowania
			}
		};

		eventSource.onerror = () => {
			setIsLiveConnected(false);
		};

		return () => {
			eventSource.close();
		};
	}, [slug]);

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

	if (notFound) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-black p-6 text-center">
				<div className="max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
					<h2 className="font-serif-luxury text-2xl font-bold text-slate-900 mb-2">
						{t("notFoundTitle")}
					</h2>
					<p className="text-sm text-slate-500 mb-6">{t("notFoundDesc")}</p>
					<Link
						href="/"
						className="inline-block px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
					>
						{t("homeBtn")}
					</Link>
				</div>
			</div>
		);
	}

	if (!gallery) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-black">
				<div className="text-center space-y-3">
					<Heart className="w-10 h-10 text-amber-500 animate-pulse mx-auto" />
					<p className="font-serif-luxury text-lg text-white">
						{tCommon("loading")}
					</p>
				</div>
			</div>
		);
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
						className={`w-2 h-2 rounded-full ${isLiveConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`}
						aria-hidden="true"
					/>
					<span>{isLiveConnected ? t("live") : t("offline")}</span>
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
