"use client";

import {
	Camera,
	Heart,
	Image as ImageIcon,
	Mic,
	Play,
	User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { css } from "styled-system/css";
import AudioPlaceholder from "@/components/AudioPlaceholder";
import EmptyState from "@/components/EmptyState";
import type { MediaItemData } from "@/lib/gallery-types";
import { findQuestTitle, type QuestsConfig } from "@/lib/photo-quests";

interface MediaGridProps {
	items: MediaItemData[];
	onItemClick: (index: number) => void;
	likedIds?: Set<string>;
	onToggleLike?: (mediaId: string) => void;
	questsConfig?: QuestsConfig | null;
}

export default function MediaGrid({
	items,
	onItemClick,
	likedIds,
	onToggleLike,
	questsConfig,
}: MediaGridProps) {
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
				const isAudio = item.fileType === "audio";
				const isVideo = item.fileType === "video";
				const isPhotographer = item.source === "photographer";
				const uploader = item.uploaderName || t("defaultUploaderName");
				const ariaLabel = `${isAudio ? t("audioAria") : isVideo ? t("videoAria") : t("imageAria")}: ${item.originalFileName}, ${t("uploaderLabel")} ${uploader}`;
				const isLiked = likedIds?.has(item.id) ?? false;
				const likesCount = item.likesCount ?? 0;
				const questTitle = findQuestTitle(questsConfig, item.questId);

				return (
					<div
						key={item.id}
						className={css({
							position: "relative",
							aspectRatio: "1/1",
							backgroundColor: "slate.100",
							borderRadius: "2xl",
							overflow: "hidden",
							boxShadow: "sm",
							transition: "all 0.3s ease",
							_hover: {
								boxShadow: "md",
								transform: "scale(1.02)",
							},
						})}
					>
						<button
							type="button"
							onClick={() => onItemClick(index)}
							aria-label={ariaLabel}
							className={css({
								position: "relative",
								w: "full",
								h: "full",
								display: "block",
								cursor: "pointer",
								textAlign: "left",
								p: "0",
								borderWidth: "0",
								backgroundColor: "transparent",
								_focusVisible: {
									outline: "2px solid",
									outlineColor: "wedding.gold",
									outlineOffset: "-2px",
								},
							})}
						>
							{/* Miniatura */}
							{isAudio ? (
								<AudioPlaceholder />
							) : (
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
							)}

							{/* Znacznik wideo/audio */}
							{(isVideo || isAudio) && (
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
									aria-label={isAudio ? t("audioAria") : t("videoAria")}
								>
									{isAudio ? (
										<Mic
											className={css({
												w: "3.5",
												h: "3.5",
											})}
											aria-hidden="true"
										/>
									) : (
										<Play
											className={css({
												w: "3.5",
												h: "3.5",
												fill: "currentColor",
												ml: "0.5",
											})}
											aria-hidden="true"
										/>
									)}
								</div>
							)}

							{/* Odznaki w lewym górnym rogu (fotograf / wyzwanie) */}
							{(isPhotographer || questTitle) && (
								<div
									className={css({
										position: "absolute",
										top: "2.5",
										left: "2.5",
										right: isVideo || isAudio ? "11" : "2.5",
										display: "flex",
										flexDirection: "column",
										alignItems: "flex-start",
										gap: "1",
									})}
								>
									{isPhotographer && (
										<div
											className={css({
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

									{questTitle && (
										<div
											className={css({
												px: "2",
												py: "0.5",
												borderRadius: "full",
												backgroundColor: "rgba(15, 23, 42, 0.8)",
												backdropFilter: "blur(12px)",
												display: "inline-flex",
												alignItems: "center",
												gap: "1",
												color: "amber.200",
												boxShadow: "sm",
												maxWidth: "full",
											})}
										>
											<span
												className={css({
													fontSize: "10px",
													fontWeight: "semibold",
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												})}
											>
												🎯 {questTitle}
											</span>
										</div>
									)}
								</div>
							)}

							{/* Gradient, podpis zdjęcia i podpis autora u dołu */}
							<div
								className={css({
									position: "absolute",
									left: "0",
									right: "0",
									bottom: "0",
									p: "2.5",
									pr: "14",
									background:
										"linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.35), transparent)",
									display: "flex",
									flexDirection: "column",
									gap: "0.5",
									color: "white",
									opacity: 0.95,
									transition: "opacity 0.2s ease",
									_hover: { opacity: 1 },
								})}
							>
								{item.caption && (
									<p
										className={css({
											fontSize: "11px",
											fontStyle: "italic",
											color: "amber.100",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										})}
									>
										{item.caption}
									</p>
								)}
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

						{/* Przycisk serduszka (rodzeństwo przycisku kafelka — brak zagnieżdżonych <button>) */}
						<button
							type="button"
							data-testid={`like-btn-${item.id}`}
							aria-pressed={isLiked}
							aria-label={isLiked ? t("unlikeAria") : t("likeAria")}
							onClick={(e) => {
								e.stopPropagation();
								onToggleLike?.(item.id);
							}}
							className={css({
								position: "absolute",
								bottom: "2",
								right: "2",
								zIndex: "10",
								display: "inline-flex",
								alignItems: "center",
								gap: "1",
								px: "2",
								py: "1",
								borderRadius: "full",
								borderWidth: "1px",
								borderColor: isLiked
									? "rgba(244, 63, 94, 0.6)"
									: "rgba(255, 255, 255, 0.25)",
								backgroundColor: isLiked
									? "rgba(225, 29, 72, 0.9)"
									: "rgba(0, 0, 0, 0.55)",
								backdropFilter: "blur(8px)",
								color: "white",
								fontSize: "11px",
								fontWeight: "semibold",
								cursor: "pointer",
								transition: "all 0.15s ease",
								_hover: {
									transform: "scale(1.08)",
									backgroundColor: isLiked
										? "rgba(190, 18, 60, 0.95)"
										: "rgba(0, 0, 0, 0.75)",
								},
								_focusVisible: {
									outline: "2px solid",
									outlineColor: "wedding.gold",
								},
							})}
						>
							<Heart
								className={css({
									w: "3.5",
									h: "3.5",
									fill: isLiked ? "currentColor" : "none",
								})}
								aria-hidden="true"
							/>
							{likesCount > 0 && <span>{likesCount}</span>}
						</button>
					</div>
				);
			})}
		</div>
	);
}
