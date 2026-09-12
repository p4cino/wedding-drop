"use client";

import { Heart, Image as ImageIcon, Plus, Sparkles, Video } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import LightboxModal, { type MediaItemData } from "@/components/LightboxModal";
import MediaGrid from "@/components/MediaGrid";
import UploaderDrawer from "@/components/UploaderDrawer";

interface GalleryData {
	id: string;
	slug: string;
	coupleNames: string;
	weddingDate: string;
	isActive: boolean;
	allowGuestDownloads: boolean;
	allowVideos: boolean;
}

export default function GuestGalleryPage() {
	const params = useParams();
	const slug = params?.slug as string;

	const [gallery, setGallery] = useState<GalleryData | null>(null);
	const [items, setItems] = useState<MediaItemData[]>([]);
	const [loading, setLoading] = useState(true);
	const [isUploaderOpen, setIsUploaderOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
	const [isLiveConnected, setIsLiveConnected] = useState(false);

	// Pobranie metadanych galerii i listy mediów
	const fetchData = useCallback(
		async (silent = false) => {
			try {
				if (!silent) setLoading(true);
				const [resGallery, resMedia] = await Promise.all([
					fetch(`/api/gallery/${slug}`),
					fetch(`/api/gallery/${slug}/media`),
				]);

				if (resGallery.ok) {
					const galData = await resGallery.json();
					setGallery(galData);
				}

				if (resMedia.ok) {
					const medData = await resMedia.json();
					setItems(medData.media || []);
				}
			} catch (err) {
				console.error("Błąd ładowania galerii:", err);
			} finally {
				setLoading(false);
			}
		},
		[slug],
	);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Połączenie z kanałem Live SSE
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
					// Dodanie nowego zdjęcia/wideo na szczyt galerii
					setItems((prev) => {
						// Zapobiegamy duplikatom
						if (prev.some((item) => item.id === data.media.id)) return prev;
						return [data.media, ...prev];
					});

					// Korekta indeksu w otwartym lightboxie, by zdjęcie nie przeskoczyło
					setLightboxIndex((curr) => (curr !== null ? curr + 1 : null));
				} else if (data.type === "media-updated" && data.update) {
					const { mediaId, status } = data.update;
					if (status === "hidden" || status === "deleted") {
						// Natychmiastowe usunięcie ukrytego/skasowanego zdjęcia z ekranów gości
						setItems((prev) => prev.filter((item) => item.id !== mediaId));
					}
				}
			} catch (_err) {
				// Ping lub cichy błąd
			}
		};

		eventSource.onerror = () => {
			setIsLiveConnected(false);
		};

		return () => {
			eventSource.close();
		};
	}, [slug]);

	if (loading && !gallery) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
				<div className="text-center space-y-3">
					<Heart className="w-10 h-10 text-amber-500 animate-pulse mx-auto" />
					<p className="font-serif-luxury text-lg text-slate-700">
						Wczytywanie galerii ślubnej...
					</p>
				</div>
			</div>
		);
	}

	if (!gallery) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-6 text-center">
				<div className="max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
					<h2 className="font-serif-luxury text-2xl font-bold text-slate-900 mb-2">
						Galeria nie została znaleziona
					</h2>
					<p className="text-sm text-slate-500 mb-6">
						Upewnij się, że adres URL lub kod QR jest prawidłowy.
					</p>
					<Link
						href="/"
						className="inline-block px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
					>
						Strona główna
					</Link>
				</div>
			</div>
		);
	}

	const imagesCount = items.filter((i) => i.fileType === "image").length;
	const videosCount = items.filter((i) => i.fileType === "video").length;

	return (
		<div className="min-h-screen pb-28 bg-[#FAF8F5]">
			{/* Elegancki nagłówek ślubny */}
			<header className="relative pt-10 pb-8 px-4 text-center overflow-hidden border-b border-amber-100/70 bg-gradient-to-b from-amber-50/40 via-white/80 to-[#FAF8F5]">
				<div className="max-w-xl mx-auto relative z-10">
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/70 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-3">
						<Sparkles className="w-3.5 h-3.5" />
						Wspomnienia z Wesela
					</div>

					<h1 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-2">
						{gallery.coupleNames}
					</h1>

					<p className="text-sm font-medium text-amber-700/80 mb-4 font-serif-luxury italic">
						{gallery.weddingDate}
					</p>

					{/* Status na żywo i statystyki */}
					<div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
						<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white shadow-xs border border-slate-200/80">
							<span
								className={`w-2 h-2 rounded-full ${isLiveConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
							/>
							<span>{isLiveConnected ? "Na żywo" : "Offline"}</span>
						</div>

						<div className="flex items-center gap-3 px-3 py-1 rounded-full bg-white shadow-xs border border-slate-200/80">
							<span className="flex items-center gap-1">
								<ImageIcon className="w-3.5 h-3.5 text-slate-400" />
								{imagesCount} zdjęć
							</span>
							{videosCount > 0 && (
								<span className="flex items-center gap-1">
									<Video className="w-3.5 h-3.5 text-slate-400" />
									{videosCount} filmów
								</span>
							)}
						</div>
					</div>
				</div>
			</header>

			{/* Siatka galerii */}
			<main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
				<MediaGrid
					items={items}
					onItemClick={(index) => setLightboxIndex(index)}
				/>
			</main>

			{/* Pływający Przycisk Dodawania Zdjęć (FAB) */}
			<div className="fixed bottom-6 inset-x-0 flex justify-center z-40 px-4 pointer-events-none">
				<button
					onClick={() => setIsUploaderOpen(true)}
					className="pointer-events-auto flex items-center gap-2.5 px-6 py-4 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold shadow-xl shadow-amber-600/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition duration-200 text-sm sm:text-base border border-amber-400/30"
				>
					<Plus className="w-5 h-5 stroke-[2.5]" />
					<span>Dodaj zdjęcia i filmy</span>
				</button>
			</div>

			{/* Drawer Uploadu */}
			<UploaderDrawer
				gallerySlug={slug}
				isOpen={isUploaderOpen}
				onClose={() => {
					setIsUploaderOpen(false);
					fetchData(true);
				}}
				onUploadSuccess={() => {
					// Natychmiastowe ciche pobranie oraz zaplanowane odpytywania w tle (1s, 2.5s, 5s)
					// jako odporny fallback dla przetwarzania plików wideo (FFmpeg) i miniaturek
					fetchData(true);
					setTimeout(() => fetchData(true), 1000);
					setTimeout(() => fetchData(true), 2500);
					setTimeout(() => fetchData(true), 5000);
				}}
			/>

			{/* Pełnoekranowy Lightbox */}
			<LightboxModal
				items={items}
				currentIndex={lightboxIndex}
				onClose={() => setLightboxIndex(null)}
				onNavigate={(newIndex) => setLightboxIndex(newIndex)}
				allowDownloads={gallery.allowGuestDownloads}
			/>
		</div>
	);
}
