"use client";

import {
	Image as ImageIcon,
	MessageCircleHeart,
	Plus,
	Sparkles,
	Video,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { css } from "styled-system/css";
import ContributorLeaderboard from "@/components/ContributorLeaderboard";
import GalleryStatusScreen from "@/components/GalleryStatusScreen";
import { LegalFooterLinks } from "@/components/LegalFooterLinks";
import LightboxModal from "@/components/LightboxModal";
import MediaGrid from "@/components/MediaGrid";
import UploaderDrawer from "@/components/UploaderDrawer";
import WishesBook from "@/components/WishesBook";
import { useLightboxSelection } from "@/hooks/useLightboxSelection";
import { useLiveGallery } from "@/hooks/useLiveGallery";

export default function GuestGalleryPage() {
	const params = useParams();
	const slug = params?.slug as string;

	const {
		gallery,
		items,
		wishes,
		status,
		isLive,
		refetch,
		refetchWithBackoff,
		addWish,
	} = useLiveGallery(slug);
	const [activeTab, setActiveTab] = useState<"photos" | "wishes">("photos");
	const [isUploaderOpen, setIsUploaderOpen] = useState(false);
	const lightbox = useLightboxSelection(items);
	const t = useTranslations("GuestGallery");
	const tWishes = useTranslations("Wishes");

	// Dodanie nowego życzenia przez gościa
	const handleAddWish = useCallback(
		async (guestName: string, message: string) => {
			try {
				const res = await fetch(`/api/gallery/${slug}/wishes`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ guestName, message }),
				});
				if (!res.ok) return false;
				addWish((await res.json()).wish);
				return true;
			} catch (err) {
				console.error("Błąd dodawania życzenia:", err);
				return false;
			}
		},
		[slug, addWish],
	);

	if (status === "loading") return <GalleryStatusScreen variant="loading" />;
	if (status === "notFound") return <GalleryStatusScreen variant="notFound" />;
	if (status === "error" || !gallery) {
		return <GalleryStatusScreen variant="error" onRetry={refetch} />;
	}

	const imagesCount = items.filter((i) => i.fileType === "image").length;
	const videosCount = items.filter((i) => i.fileType === "video").length;

	return (
		<div
			className={css({
				minH: "100vh",
				pb: "28",
				backgroundColor: "#FAF8F5",
			})}
		>
			{/* Elegancki nagłówek ślubny */}
			<header
				className={css({
					position: "relative",
					pt: "10",
					pb: "8",
					px: "4",
					textAlign: "center",
					overflow: "hidden",
					borderBottomWidth: "1px",
					borderBottomColor: "rgba(254, 243, 199, 0.7)",
					background:
						"linear-gradient(to bottom, rgba(254, 243, 199, 0.4), rgba(255, 255, 255, 0.8), #FAF8F5)",
				})}
			>
				<div
					className={css({
						maxW: "xl",
						mx: "auto",
						position: "relative",
						zIndex: "10",
					})}
				>
					<div
						className={css({
							display: "inline-flex",
							alignItems: "center",
							gap: "2",
							px: "3",
							py: "1",
							borderRadius: "full",
							backgroundColor: "rgba(254, 243, 199, 0.7)",
							color: "amber.800",
							fontSize: "xs",
							fontWeight: "semibold",
							textTransform: "uppercase",
							letterSpacing: "wider",
							mb: "3",
						})}
					>
						<Sparkles
							className={css({ w: "3.5", h: "3.5" })}
							aria-hidden="true"
						/>
						{t("badge")}
					</div>

					<h1
						className={css({
							fontFamily: "serif",
							fontSize: { base: "3xl", sm: "4xl", md: "5xl" },
							fontWeight: "bold",
							color: "wedding.slate",
							letterSpacing: "tight",
							mb: "2",
						})}
					>
						{gallery.coupleNames}
					</h1>

					<p
						className={css({
							fontSize: "sm",
							fontWeight: "medium",
							color: "wedding.gold",
							mb: "4",
							fontFamily: "serif",
							fontStyle: "italic",
						})}
					>
						{gallery.weddingDate}
					</p>

					{/* Status na żywo i statystyki */}
					<div
						className={css({
							display: "flex",
							flexWrap: "wrap",
							alignItems: "center",
							justifyContent: "center",
							gap: "3",
							fontSize: "xs",
							color: "slate.600",
						})}
					>
						<div
							role="status"
							aria-live="polite"
							className={css({
								display: "flex",
								alignItems: "center",
								gap: "1.5",
								px: "2.5",
								py: "1",
								borderRadius: "full",
								backgroundColor: "white",
								boxShadow: "xs",
								borderWidth: "1px",
								borderColor: "slate.200",
							})}
						>
							<span
								className={css({
									w: "2",
									h: "2",
									borderRadius: "full",
									backgroundColor: isLive ? "emerald.500" : "slate.400",
									animation: isLive
										? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
										: undefined,
								})}
								aria-hidden="true"
							/>
							<span>{isLive ? t("live") : t("offline")}</span>
						</div>

						<div
							className={css({
								display: "flex",
								alignItems: "center",
								gap: "3",
								px: "3",
								py: "1",
								borderRadius: "full",
								backgroundColor: "white",
								boxShadow: "xs",
								borderWidth: "1px",
								borderColor: "slate.200",
							})}
						>
							<span
								className={css({
									display: "flex",
									alignItems: "center",
									gap: "1",
								})}
							>
								<ImageIcon
									className={css({ w: "3.5", h: "3.5", color: "slate.400" })}
									aria-hidden="true"
								/>
								{t("photosCount", { count: imagesCount })}
							</span>
							{videosCount > 0 && (
								<span
									className={css({
										display: "flex",
										alignItems: "center",
										gap: "1",
									})}
								>
									<Video
										className={css({ w: "3.5", h: "3.5", color: "slate.400" })}
										aria-hidden="true"
									/>
									{t("videosCount", { count: videosCount })}
								</span>
							)}
						</div>
					</div>
				</div>
			</header>

			{/* Zakładki: Zdjęcia / Życzenia */}
			<div
				className={css({
					maxW: "6xl",
					mx: "auto",
					px: { base: "4", sm: "6" },
					pt: "6",
				})}
			>
				<div
					role="tablist"
					aria-label={t("tabsAria")}
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "2",
						backgroundColor: "white",
						p: "1.5",
						borderRadius: "2xl",
						borderWidth: "1px",
						borderColor: "slate.200",
						w: "fit-content",
						mx: "auto",
						boxShadow: "xs",
					})}
				>
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === "photos"}
						onClick={() => setActiveTab("photos")}
						className={css({
							display: "flex",
							alignItems: "center",
							gap: "1.5",
							px: "4",
							py: "2",
							borderRadius: "xl",
							fontSize: "sm",
							fontWeight: "semibold",
							borderWidth: "0",
							cursor: "pointer",
							transition: "all 0.15s ease",
							backgroundColor:
								activeTab === "photos" ? "slate.900" : "transparent",
							color: activeTab === "photos" ? "white" : "slate.600",
							_hover: {
								backgroundColor:
									activeTab === "photos" ? "slate.900" : "slate.100",
							},
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "wedding.gold",
							},
						})}
					>
						<ImageIcon className={css({ w: "4", h: "4" })} aria-hidden="true" />
						<span>{t("tabPhotos")}</span>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === "wishes"}
						onClick={() => setActiveTab("wishes")}
						className={css({
							display: "flex",
							alignItems: "center",
							gap: "1.5",
							px: "4",
							py: "2",
							borderRadius: "xl",
							fontSize: "sm",
							fontWeight: "semibold",
							borderWidth: "0",
							cursor: "pointer",
							transition: "all 0.15s ease",
							backgroundColor:
								activeTab === "wishes" ? "slate.900" : "transparent",
							color: activeTab === "wishes" ? "white" : "slate.600",
							_hover: {
								backgroundColor:
									activeTab === "wishes" ? "slate.900" : "slate.100",
							},
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "wedding.gold",
							},
						})}
					>
						<MessageCircleHeart
							className={css({ w: "4", h: "4" })}
							aria-hidden="true"
						/>
						<span>{tWishes("tabWishes", { count: wishes.length })}</span>
					</button>
				</div>
			</div>

			{/* Ranking najaktywniejszych gości (TOP 3) — tylko w zakładce zdjęć */}
			{activeTab === "photos" && (
				<div className={css({ pt: "6" })}>
					<ContributorLeaderboard items={items} />
				</div>
			)}

			{/* Siatka galerii lub księga życzeń */}
			<main
				className={css({
					maxW: "6xl",
					mx: "auto",
					px: { base: "4", sm: "6" },
					pt: "6",
				})}
			>
				{activeTab === "photos" ? (
					<MediaGrid items={items} onItemClick={lightbox.open} />
				) : (
					<WishesBook wishes={wishes} onSubmit={handleAddWish} />
				)}
			</main>

			{/* Pływający Przycisk Dodawania Zdjęć (FAB) */}
			{activeTab === "photos" && (
				<div
					className={css({
						position: "fixed",
						bottom: "6",
						left: "0",
						right: "0",
						display: "flex",
						justifyContent: "center",
						zIndex: "40",
						px: "4",
						pointerEvents: "none",
					})}
				>
					<button
						type="button"
						onClick={() => setIsUploaderOpen(true)}
						aria-haspopup="dialog"
						aria-expanded={isUploaderOpen}
						aria-label={t("addPhotosAria")}
						className={css({
							pointerEvents: "auto",
							display: "flex",
							alignItems: "center",
							gap: "2.5",
							px: "6",
							py: "4",
							borderRadius: "full",
							background: "linear-gradient(to right, #b45309, #d97706)",
							_hover: {
								background: "linear-gradient(to right, #92400e, #b45309)",
								transform: "scale(1.05)",
							},
							_active: { transform: "scale(0.95)" },
							color: "white",
							fontWeight: "semibold",
							boxShadow: "0 20px 25px -5px rgba(180, 83, 9, 0.3)",
							transition: "all 0.2s ease",
							fontSize: { base: "sm", sm: "base" },
							borderWidth: "1px",
							borderColor: "rgba(251, 191, 36, 0.3)",
							cursor: "pointer",
							_focusVisible: {
								outline: "4px solid",
								outlineColor: "rgba(245, 158, 11, 0.5)",
							},
						})}
					>
						<Plus
							className={css({ w: "5", h: "5", strokeWidth: "2.5" })}
							aria-hidden="true"
						/>
						<span>{t("addPhotosBtn")}</span>
					</button>
				</div>
			)}

			{/* Drawer Uploadu */}
			<UploaderDrawer
				gallerySlug={slug}
				primaryColor={gallery.primaryColor}
				accentColor={gallery.accentColor}
				isOpen={isUploaderOpen}
				onClose={() => {
					setIsUploaderOpen(false);
					refetch();
				}}
				onUploadSuccess={refetchWithBackoff}
			/>

			{/* Pełnoekranowy Lightbox */}
			<LightboxModal
				items={items}
				currentIndex={lightbox.index}
				onClose={lightbox.close}
				onNavigate={lightbox.navigate}
				allowDownloads={gallery.allowGuestDownloads}
			/>

			{/* Stopka z dokumentami prawnymi */}
			<footer
				className={css({
					pt: "16",
					pb: "8",
					textAlign: "center",
					fontSize: "xs",
					color: "slate.500",
				})}
			>
				<LegalFooterLinks />
			</footer>
		</div>
	);
}
