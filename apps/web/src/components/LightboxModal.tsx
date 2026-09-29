"use client";

import { ChevronLeft, ChevronRight, Download, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect } from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useSwipe } from "@/hooks/useSwipe";

import type { MediaItemData } from "@/lib/gallery-types";

export type { MediaItemData };

interface LightboxModalProps {
	items: MediaItemData[];
	currentIndex: number | null;
	onClose: () => void;
	onNavigate: (index: number) => void;
	allowDownloads?: boolean;
}

function NavButton({
	side,
	label,
	icon,
	onClick,
}: {
	side: "left" | "right";
	label: string;
	icon: React.ReactNode;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			title={label}
			aria-label={label}
			className={`absolute ${side === "left" ? "left-2 sm:left-4" : "right-2 sm:right-4"} p-2.5 sm:p-3 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white transition z-20 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none`}
		>
			{icon}
		</button>
	);
}

export default function LightboxModal({
	items,
	currentIndex,
	onClose,
	onNavigate,
	allowDownloads = true,
}: LightboxModalProps) {
	const t = useTranslations("GuestGallery");

	const dialogRef = React.useRef<HTMLDivElement>(null);
	const isOpen = currentIndex !== null;

	useFocusTrap(dialogRef, isOpen);
	useEscapeKey(isOpen, onClose);

	const hasPrev = currentIndex !== null && currentIndex > 0;
	const hasNext = currentIndex !== null && currentIndex < items.length - 1;
	const goPrev = () => currentIndex !== null && onNavigate(currentIndex - 1);
	const goNext = () => currentIndex !== null && onNavigate(currentIndex + 1);

	// Strzałki klawiatury (Escape i pułapka fokusu obsługują wspólne hooki)
	useEffect(() => {
		if (currentIndex === null) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowLeft" && currentIndex > 0) {
				e.preventDefault();
				onNavigate(currentIndex - 1);
			} else if (e.key === "ArrowRight" && currentIndex < items.length - 1) {
				e.preventDefault();
				onNavigate(currentIndex + 1);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [currentIndex, items.length, onNavigate]);

	const swipe = useSwipe({
		// Przesunięcie w lewo -> następne, w prawo -> poprzednie
		onSwipeLeft: () => hasNext && goNext(),
		onSwipeRight: () => hasPrev && goPrev(),
	});

	if (currentIndex === null || !items[currentIndex]) return null;
	const current = items[currentIndex];

	return (
		<div
			ref={dialogRef}
			role="dialog"
			aria-modal="true"
			aria-label={t("lightboxAria", { name: current.originalFileName })}
			tabIndex={-1}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none touch-none focus:outline-none"
			{...swipe}
		>
			{/* Region dostępny dla czytników ekranu anonsujący zmianę slajdu */}
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{t("slideAnnouncement", {
					current: currentIndex + 1,
					total: items.length,
					name: current.originalFileName,
				})}
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
			{hasPrev && (
				<NavButton
					side="left"
					label={t("prevMedia")}
					onClick={goPrev}
					icon={
						<ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
					}
				/>
			)}

			{hasNext && (
				<NavButton
					side="right"
					label={t("nextMedia")}
					onClick={goNext}
					icon={
						<ChevronRight
							className="w-5 h-5 sm:w-6 sm:h-6"
							aria-hidden="true"
						/>
					}
				/>
			)}

			{/* Podgląd nośnika */}
			<div className="w-full h-full flex items-center justify-center p-2 sm:p-12">
				{current.fileType === "video" ? (
					<video
						src={current.rawUrl}
						controls
						autoPlay
						playsInline
						aria-label={`${t("videoAria")}: ${current.originalFileName}`}
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
