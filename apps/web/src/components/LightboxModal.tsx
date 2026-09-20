"use client";

import { ChevronLeft, ChevronRight, Download, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect } from "react";

export interface MediaItemData {
	id: string;
	uploaderName: string;
	fileType: "image" | "video";
	mimeType: string;
	originalFileName: string;
	thumbUrl: string;
	rawUrl: string;
	createdAt: string;
}

interface LightboxModalProps {
	items: MediaItemData[];
	currentIndex: number | null;
	onClose: () => void;
	onNavigate: (index: number) => void;
	allowDownloads?: boolean;
}

export default function LightboxModal({
	items,
	currentIndex,
	onClose,
	onNavigate,
	allowDownloads = true,
}: LightboxModalProps) {
	const t = useTranslations("GuestGallery");

	const touchStartX = React.useRef<number | null>(null);
	const touchEndX = React.useRef<number | null>(null);
	const dialogRef = React.useRef<HTMLDivElement>(null);
	const previousFocusRef = React.useRef<HTMLElement | null>(null);

	const isOpen = currentIndex !== null;

	// Zachowanie i przywracanie fokusu przed otwarciem / po zamknięciu modala
	useEffect(() => {
		if (!isOpen) return;
		previousFocusRef.current = document.activeElement as HTMLElement | null;
		const focusable = dialogRef.current?.querySelector<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
		);
		(focusable || dialogRef.current)?.focus();

		return () => {
			previousFocusRef.current?.focus();
		};
	}, [isOpen]);

	// Obsługa klawiatury: Escape, strzałki oraz pułapka fokusu Tab
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (currentIndex === null) return;
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
				return;
			}
			if (e.key === "ArrowLeft" && currentIndex > 0) {
				e.preventDefault();
				onNavigate(currentIndex - 1);
				return;
			}
			if (e.key === "ArrowRight" && currentIndex < items.length - 1) {
				e.preventDefault();
				onNavigate(currentIndex + 1);
				return;
			}

			// Focus trap (uwięzienie fokusu)
			if (e.key === "Tab" && dialogRef.current) {
				const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
					'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
				);
				if (focusables.length === 0) return;

				const firstElement = focusables[0];
				const lastElement = focusables[focusables.length - 1];

				if (e.shiftKey && document.activeElement === firstElement) {
					e.preventDefault();
					lastElement?.focus();
				} else if (!e.shiftKey && document.activeElement === lastElement) {
					e.preventDefault();
					firstElement?.focus();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [currentIndex, items.length, onClose, onNavigate]);

	const handleTouchStart = (e: React.TouchEvent) => {
		touchStartX.current = e.targetTouches[0].clientX;
		touchEndX.current = null;
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		touchEndX.current = e.targetTouches[0].clientX;
	};

	const handleTouchEnd = () => {
		if (
			touchStartX.current === null ||
			touchEndX.current === null ||
			currentIndex === null
		)
			return;
		const diff = touchStartX.current - touchEndX.current;
		const minSwipeDistance = 45; // piksele

		if (diff > minSwipeDistance && currentIndex < items.length - 1) {
			// Przesunięcie w lewo -> Następne zdjęcie
			onNavigate(currentIndex + 1);
		} else if (diff < -minSwipeDistance && currentIndex > 0) {
			// Przesunięcie w prawo -> Poprzednie zdjęcie
			onNavigate(currentIndex - 1);
		}
		touchStartX.current = null;
		touchEndX.current = null;
	};

	if (currentIndex === null || !items[currentIndex]) return null;
	const current = items[currentIndex];

	return (
		<div
			ref={dialogRef}
			role="dialog"
			aria-modal="true"
			aria-label={`Podgląd multimediów: ${current.originalFileName}`}
			tabIndex={-1}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none touch-none focus:outline-none"
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			{/* Region dostępny dla czytników ekranu anonsujący zmianę slajdu */}
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				Element {currentIndex + 1} z {items.length}: {current.originalFileName}
			</div>

			{/* Górny pasek nawigacji */}
			<div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
				<div className="text-white text-xs space-y-0.5">
					<div className="flex items-center gap-2">
						<User className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
						<span className="font-semibold text-sm">
							{current.uploaderName}
						</span>
					</div>
					<p className="text-slate-400 text-[11px] truncate max-w-[200px] sm:max-w-md">
						{current.originalFileName}
					</p>
				</div>

				<div className="flex items-center gap-3">
					{allowDownloads && (
						<a
							href={current.rawUrl}
							download={current.originalFileName}
							className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
							title={t("downloadOriginal")}
							aria-label={t("downloadOriginal")}
						>
							<Download className="w-5 h-5" aria-hidden="true" />
						</a>
					)}
					<button
						type="button"
						onClick={onClose}
						className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
						title={t("closeLightbox")}
						aria-label={t("closeLightbox")}
					>
						<X className="w-5 h-5" aria-hidden="true" />
					</button>
				</div>
			</div>

			{/* Strzałki poprzedni/następny (zoptymalizowane pod desktop i mobile) */}
			{currentIndex > 0 && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onNavigate(currentIndex - 1);
					}}
					title={t("prevMedia")}
					aria-label={t("prevMedia")}
					className="absolute left-2 sm:left-4 p-2.5 sm:p-3 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white transition z-20 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
				>
					<ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
				</button>
			)}

			{currentIndex < items.length - 1 && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onNavigate(currentIndex + 1);
					}}
					title={t("nextMedia")}
					aria-label={t("nextMedia")}
					className="absolute right-2 sm:right-4 p-2.5 sm:p-3 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white transition z-20 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
				>
					<ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
				</button>
			)}

			{/* Podgląd nośnika */}
			<div className="w-full h-full flex items-center justify-center p-2 sm:p-12">
				{current.fileType === "video" ? (
					<video
						src={current.rawUrl}
						controls
						autoPlay
						playsInline
						aria-label={`Wideo: ${current.originalFileName}`}
						className="max-w-full max-h-[85vh] rounded-xl shadow-2xl"
					/>
				) : (
					<img
						src={current.rawUrl}
						alt={current.originalFileName}
						className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl transition duration-300"
					/>
				)}
			</div>

			{/* Dolny wskaźnik pozycji */}
			<div
				aria-hidden="true"
				className="absolute bottom-4 inset-x-0 text-center text-xs text-slate-400 font-medium pointer-events-none"
			>
				{t("progressCount", { current: currentIndex + 1, total: items.length })}
			</div>
		</div>
	);
}
