"use client";

import { Camera, Image as ImageIcon, Play, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { css } from "styled-system/css";
import EmptyState from "@/components/EmptyState";
import type { MediaItemData } from "@/lib/gallery-types";

interface MediaGridProps {
	items: MediaItemData[];
	onItemClick: (index: number) => void;
}

export default function MediaGrid({ items, onItemClick }: MediaGridProps) {
	const t = useTranslations("GuestGallery");
	if (items.length === 0) {
		return (
			<EmptyState
				className={css({ py: "20" })}
				icon={
					<ImageIcon className={css({ w: "8", h: "8" })} aria-hidden="true" />
				}
				title={t("noPhotos")}
				hint={t("beFirst")}
			/>
		);
	}

	return (
		<div
			className={css({
				display: "grid",
				gridTemplateColumns: {
					base: "repeat(2, 1fr)",
					sm: "repeat(3, 1fr)",
					md: "repeat(4, 1fr)",
					lg: "repeat(5, 1fr)",
				},
				gap: { base: "3", sm: "4" },
			})}
		>
			{items.map((item, index) => {
				const isVideo = item.fileType === "video";
				const isPhotographer = item.source === "photographer";
				const uploader = item.uploaderName || t("defaultUploaderName");
				const ariaLabel = `${isVideo ? t("videoAria") : t("imageAria")}: ${item.originalFileName}, ${t("uploaderLabel")} ${uploader}`;

				return (
					<button
						type="button"
						key={item.id}
						onClick={() => onItemClick(index)}
						aria-label={ariaLabel}
						className={css({
							position: "relative",
							aspectRatio: "1/1",
							backgroundColor: "slate.100",
							borderRadius: "2xl",
							overflow: "hidden",
							cursor: "pointer",
							boxShadow: "sm",
							textAlign: "left",
							p: "0",
							borderWidth: "0",
							transition: "all 0.3s ease",
							_hover: {
								boxShadow: "md",
								transform: "scale(1.02)",
							},
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "wedding.gold",
							},
						})}
					>
						{/* Miniatura */}
						<img
							src={item.thumbUrl}
							alt={item.originalFileName}
							loading="lazy"
							className={css({
								w: "full",
								h: "full",
								objectFit: "cover",
								transition: "transform 0.5s ease",
								_hover: { transform: "scale(1.05)" },
							})}
						/>

						{/* Znacznik wideo */}
						{isVideo && (
							<div
								className={css({
									position: "absolute",
									top: "2.5",
									right: "2.5",
									w: "7",
									h: "7",
									borderRadius: "full",
									backgroundColor: "rgba(0, 0, 0, 0.6)",
									backdropFilter: "blur(12px)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "white",
									boxShadow: "sm",
								})}
							>
								<Play
									className={css({
										w: "3.5",
										h: "3.5",
										fill: "currentColor",
										ml: "0.5",
									})}
									aria-hidden="true"
								/>
							</div>
						)}

						{/* Odznaka materiału od fotografa/kamerzysty */}
						{isPhotographer && (
							<div
								className={css({
									position: "absolute",
									top: "2.5",
									left: "2.5",
									px: "2",
									py: "1",
									borderRadius: "full",
									backgroundColor: "rgba(202, 138, 4, 0.9)",
									backdropFilter: "blur(12px)",
									display: "flex",
									alignItems: "center",
									gap: "1",
									color: "white",
									boxShadow: "sm",
								})}
								aria-label={t("photographerBadge")}
							>
								<Camera
									className={css({ w: "3", h: "3" })}
									aria-hidden="true"
								/>
								<span
									className={css({
										fontSize: "10px",
										fontWeight: "semibold",
										textTransform: "uppercase",
										letterSpacing: "wide",
									})}
								>
									{t("photographerBadge")}
								</span>
							</div>
						)}

						{/* Gradient i podpis u dołu */}
						<div
							className={css({
								position: "absolute",
								left: "0",
								right: "0",
								bottom: "0",
								p: "2.5",
								background:
									"linear-gradient(to top, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.3), transparent)",
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								color: "white",
								opacity: 0.95,
								transition: "opacity 0.2s ease",
								_hover: { opacity: 1 },
							})}
						>
							<div
								className={css({
									display: "flex",
									alignItems: "center",
									gap: "1.5",
									minW: "0",
								})}
							>
								<User
									className={css({
										w: "3",
										h: "3",
										color: "amber.300",
										flexShrink: 0,
									})}
									aria-hidden="true"
								/>
								<span
									className={css({
										fontSize: "11px",
										fontWeight: "medium",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
										filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5))",
									})}
								>
									{uploader}
								</span>
							</div>
						</div>
					</button>
				);
			})}
		</div>
	);
}
