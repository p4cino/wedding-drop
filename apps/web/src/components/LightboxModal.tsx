"use client";

import {
	ChevronLeft,
	ChevronRight,
	Download,
	Heart,
	User,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect } from "react";
import { css } from "styled-system/css";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useSwipe } from "@/hooks/useSwipe";
import type { MediaItemData } from "@/lib/gallery-types";
import { findQuestTitle, type QuestsConfig } from "@/lib/photo-quests";

export type { MediaItemData };

type LightboxMediaItem = MediaItemData & {
	likesCount?: number;
	caption?: string | null;
	questId?: string | null;
};

interface LightboxModalProps {
	items: LightboxMediaItem[];
	currentIndex: number | null;
	onClose: () => void;
	onNavigate: (index: number) => void;
	allowDownloads?: boolean;
	isLiked?: boolean;
	likedIds?: Set<string>;
	onToggleLike?: (mediaId: string) => void;
	questTitle?: string | null;
	questsConfig?: QuestsConfig | null;
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
			className={css({
				position: "absolute",
				left: side === "left" ? { base: "2", sm: "4" } : undefined,
				right: side === "right" ? { base: "2", sm: "4" } : undefined,
				p: { base: "2.5", sm: "3" },
				borderRadius: "full",
				backgroundColor: "rgba(255, 255, 255, 0.15)",
				_hover: { backgroundColor: "rgba(255, 255, 255, 0.25)" },
				_active: { transform: "scale(0.95)" },
				color: "white",
				transition: "all 0.15s ease",
				zIndex: "20",
				cursor: "pointer",
				_focusVisible: {
					outline: "2px solid",
					outlineColor: "amber.400",
				},
			})}
		>
			{icon}
		</button>
	);
}

/** Przeciąganie suwaka odtwarzacza nie może przewijać galerii: dotyk startujący na pasku kontrolek nie trafia do `useSwipe`. */
function guardControlsSwipe(
	e: React.TouchEvent<HTMLElement>,
	controlsHeight: number,
) {
	const rect = e.currentTarget.getBoundingClientRect();
	if (e.targetTouches[0].clientY >= rect.bottom - controlsHeight) {
		e.stopPropagation();
	}
}

export default function LightboxModal({
	items,
	currentIndex,
	onClose,
	onNavigate,
	allowDownloads = true,
	isLiked,
	likedIds,
	onToggleLike,
	questTitle,
	questsConfig,
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
	const currentIsLiked =
		isLiked !== undefined ? isLiked : (likedIds?.has(current.id) ?? false);
	const currentLikesCount = current.likesCount ?? 0;
	const resolvedQuestTitle =
		questTitle !== undefined
			? questTitle
			: findQuestTitle(questsConfig, current.questId);

	return (
		<div
			ref={dialogRef}
			role="dialog"
			aria-modal="true"
			aria-label={t("lightboxAria", { name: current.originalFileName })}
			tabIndex={-1}
			className={css({
				position: "fixed",
				inset: "0",
				zIndex: "50",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "rgba(0, 0, 0, 0.95)",
				backdropFilter: "blur(12px)",
				userSelect: "none",
				touchAction: "none",
				_focus: { outline: "none" },
			})}
			{...swipe}
		>
			{/* Region dostępny dla czytników ekranu anonsujący zmianę slajdu */}
			<div
				className={css({
					position: "absolute",
					width: "1px",
					height: "1px",
					padding: "0",
					margin: "-1px",
					overflow: "hidden",
					clip: "rect(0, 0, 0, 0)",
					whiteSpace: "nowrap",
					borderWidth: "0",
				})}
				aria-live="polite"
				aria-atomic="true"
			>
				{t("slideAnnouncement", {
					current: currentIndex + 1,
					total: items.length,
					name: current.originalFileName,
				})}
			</div>

			{/* Górny pasek nawigacji */}
			<div
				className={css({
					position: "absolute",
					top: "0",
					left: "0",
					right: "0",
					p: "4",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					zIndex: "20",
					background:
						"linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)",
				})}
			>
				<div
					className={css({
						color: "white",
						fontSize: "xs",
						display: "flex",
						flexDirection: "column",
						gap: "1",
						minW: "0",
					})}
				>
					<div
						className={css({
							display: "flex",
							flexWrap: "wrap",
							alignItems: "center",
							gap: "2",
						})}
					>
						<User
							className={css({
								w: "3.5",
								h: "3.5",
								color: "amber.400",
							})}
							aria-hidden="true"
						/>
						<span
							className={css({
								fontWeight: "semibold",
								fontSize: "sm",
							})}
						>
							{current.uploaderName}
						</span>
						{resolvedQuestTitle && (
							<span
								className={css({
									display: "inline-flex",
									alignItems: "center",
									gap: "1",
									px: "2.5",
									py: "0.5",
									borderRadius: "full",
									backgroundColor: "rgba(217, 119, 6, 0.25)",
									borderWidth: "1px",
									borderColor: "rgba(251, 191, 36, 0.4)",
									color: "amber.200",
									fontSize: "11px",
									fontWeight: "semibold",
								})}
							>
								🎯 {resolvedQuestTitle}
							</span>
						)}
					</div>
					{current.caption && (
						<p
							className={css({
								color: "amber.100",
								fontSize: "sm",
								fontStyle: "italic",
								maxWidth: { base: "260px", sm: "xl" },
							})}
						>
							{current.caption}
						</p>
					)}
					<p
						className={css({
							color: "slate.400",
							fontSize: "11px",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
							maxWidth: { base: "200px", sm: "md" },
						})}
					>
						{current.originalFileName}
					</p>
				</div>

				<div
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "3",
					})}
				>
					<button
						type="button"
						data-testid="lightbox-like-btn"
						aria-pressed={currentIsLiked}
						aria-label={currentIsLiked ? t("unlikeAria") : t("likeAria")}
						onClick={(e) => {
							e.stopPropagation();
							onToggleLike?.(current.id);
						}}
						className={css({
							display: "inline-flex",
							alignItems: "center",
							gap: "1.5",
							px: "3.5",
							py: "2",
							borderRadius: "full",
							backgroundColor: currentIsLiked
								? "rgba(225, 29, 72, 0.9)"
								: "rgba(255, 255, 255, 0.1)",
							_hover: {
								backgroundColor: currentIsLiked
									? "rgba(190, 18, 60, 0.95)"
									: "rgba(255, 255, 255, 0.2)",
							},
							color: "white",
							fontSize: "sm",
							fontWeight: "semibold",
							transition: "all 0.15s ease",
							backdropFilter: "blur(4px)",
							cursor: "pointer",
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "amber.400",
							},
						})}
					>
						<Heart
							className={css({
								w: "4",
								h: "4",
								fill: currentIsLiked ? "currentColor" : "none",
							})}
							aria-hidden="true"
						/>
						<span>{currentLikesCount}</span>
					</button>

					{allowDownloads && (
						<a
							href={current.rawUrl}
							download={current.originalFileName}
							className={css({
								p: "2.5",
								borderRadius: "full",
								backgroundColor: "rgba(255, 255, 255, 0.1)",
								_hover: {
									backgroundColor: "rgba(255, 255, 255, 0.2)",
								},
								color: "white",
								transition: "all 0.15s ease",
								backdropFilter: "blur(4px)",
								_focusVisible: {
									outline: "2px solid",
									outlineColor: "amber.400",
								},
							})}
							title={t("downloadOriginal")}
							aria-label={t("downloadOriginal")}
						>
							<Download
								className={css({ w: "5", h: "5" })}
								aria-hidden="true"
							/>
						</a>
					)}
					<button
						type="button"
						onClick={onClose}
						className={css({
							p: "2.5",
							borderRadius: "full",
							backgroundColor: "rgba(255, 255, 255, 0.1)",
							_hover: {
								backgroundColor: "rgba(255, 255, 255, 0.2)",
							},
							color: "white",
							transition: "all 0.15s ease",
							backdropFilter: "blur(4px)",
							cursor: "pointer",
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "amber.400",
							},
						})}
						title={t("closeLightbox")}
						aria-label={t("closeLightbox")}
					>
						<X className={css({ w: "5", h: "5" })} aria-hidden="true" />
					</button>
				</div>
			</div>

			{/* Strzałki poprzedni/następny */}
			{hasPrev && (
				<NavButton
					side="left"
					label={t("prevMedia")}
					onClick={goPrev}
					icon={
						<ChevronLeft
							className={css({
								w: { base: "5", sm: "6" },
								h: { base: "5", sm: "6" },
							})}
							aria-hidden="true"
						/>
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
							className={css({
								w: { base: "5", sm: "6" },
								h: { base: "5", sm: "6" },
							})}
							aria-hidden="true"
						/>
					}
				/>
			)}

			{/* Podgląd nośnika */}
			<div
				className={css({
					width: "full",
					height: "full",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					p: { base: "2", sm: "12" },
				})}
			>
				{current.fileType === "audio" ? (
					<audio
						src={current.rawUrl}
						controls
						autoPlay
						onTouchStart={(e) =>
							guardControlsSwipe(e, Number.POSITIVE_INFINITY)
						}
						aria-label={`${t("audioAria")}: ${current.originalFileName}`}
						className={css({
							width: "full",
							maxWidth: "md",
							borderRadius: "xl",
							boxShadow: "2xl",
						})}
					/>
				) : current.fileType === "video" ? (
					<video
						src={current.rawUrl}
						controls
						autoPlay
						playsInline
						onTouchStart={(e) => guardControlsSwipe(e, 64)}
						aria-label={`${t("videoAria")}: ${current.originalFileName}`}
						className={css({
							maxWidth: "full",
							maxHeight: "85vh",
							borderRadius: "xl",
							boxShadow: "2xl",
						})}
					/>
				) : (
					<img
						src={current.rawUrl}
						alt={current.originalFileName}
						className={css({
							maxWidth: "full",
							maxHeight: "85vh",
							objectFit: "contain",
							borderRadius: "xl",
							boxShadow: "2xl",
							transition: "all 0.3s ease",
						})}
					/>
				)}
			</div>

			{/* Dolny wskaźnik pozycji */}
			<div
				aria-hidden="true"
				className={css({
					position: "absolute",
					bottom: "4",
					left: "0",
					right: "0",
					textAlign: "center",
					fontSize: "xs",
					color: "slate.400",
					fontWeight: "medium",
					pointerEvents: "none",
				})}
			>
				{t("progressCount", {
					current: currentIndex + 1,
					total: items.length,
				})}
			</div>
		</div>
	);
}
