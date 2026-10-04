"use client";

import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { css } from "styled-system/css";
import {
	countByStatus,
	filterByStatus,
	type ModerationFilter,
	type ModerationStatus,
} from "@/lib/moderation";
import { ModerationActions } from "./ModerationActions";
import { ModerationFilterBar } from "./ModerationFilterBar";

export interface OwnerMediaItem {
	id: string;
	uploaderName: string;
	source?: "guest" | "photographer";
	fileType: "image" | "video";
	originalFileName: string;
	fileSize: number;
	thumbUrl: string;
	rawUrl: string;
	status: ModerationStatus;
	createdAt: string;
}

interface MediaGridWithModerationProps {
	mediaList: OwnerMediaItem[];
	onToggleStatus: (mediaId: string, currentStatus: ModerationStatus) => void;
	onDeleteMedia: (mediaId: string) => void;
}

export const MediaGridWithModeration: React.FC<
	MediaGridWithModerationProps
> = ({ mediaList, onToggleStatus, onDeleteMedia }) => {
	const t = useTranslations("OwnerPanel");
	const [filter, setFilter] = useState<ModerationFilter>("all");
	const filteredMedia = filterByStatus(mediaList, filter);

	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				gap: "4",
			})}
		>
			{/* Pasek filtrowania i moderacji */}
			<div
				className={css({
					bg: "white",
					p: "4",
					borderRadius: "2xl",
					borderWidth: "1px",
					borderColor: "slate.200",
					display: "flex",
					flexWrap: "wrap",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "4",
				})}
			>
				<ModerationFilterBar
					value={filter}
					onChange={setFilter}
					groupLabel={t("filterAria")}
					title={t("filterLabel")}
					labels={{
						all: t("filterAll", { count: mediaList.length }),
						ready: t("filterVisible", {
							count: countByStatus(mediaList, "ready"),
						}),
						hidden: t("filterHidden", {
							count: countByStatus(mediaList, "hidden"),
						}),
						pending: t("filterPending", {
							count: countByStatus(mediaList, "pending"),
						}),
					}}
				/>

				<p className={css({ fontSize: "xs", color: "slate.500" })}>
					{t("hiddenHint")}
				</p>
			</div>

			{/* Siatka moderacji */}
			<div
				className={css({
					display: "grid",
					gridTemplateColumns: {
						base: "repeat(2, 1fr)",
						sm: "repeat(3, 1fr)",
						md: "repeat(4, 1fr)",
						lg: "repeat(6, 1fr)",
					},
					gap: "4",
				})}
			>
				{filteredMedia.map((item) => {
					const isHidden = item.status === "hidden";
					return (
						<div
							key={item.id}
							className={css({
								position: "relative",
								bg: "white",
								borderRadius: "2xl",
								overflow: "hidden",
								borderWidth: "1px",
								borderStyle: isHidden ? "dashed" : "solid",
								borderColor: isHidden ? "red.300" : "slate.200",
								opacity: isHidden ? 0.6 : 1,
								boxShadow: "xs",
								transition: "all 0.2s ease",
							})}
						>
							<div
								className={css({
									aspectRatio: "1/1",
									position: "relative",
									overflow: "hidden",
									bg: "slate.100",
								})}
							>
								<img
									src={item.thumbUrl}
									alt={item.originalFileName}
									className={css({
										w: "full",
										h: "full",
										objectFit: "cover",
									})}
								/>
								{isHidden && (
									<div
										className={css({
											position: "absolute",
											inset: "0",
											bg: "rgba(69, 10, 10, 0.4)",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											color: "white",
											fontSize: "10px",
											fontWeight: "bold",
											textTransform: "uppercase",
											letterSpacing: "wider",
										})}
									>
										{t("hiddenOverlay")}
									</div>
								)}

								{item.source === "photographer" && (
									<div
										className={css({
											position: "absolute",
											top: "1.5",
											left: "1.5",
											px: "1.5",
											py: "0.5",
											borderRadius: "full",
											bg: "rgba(202, 138, 4, 0.9)",
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
											className={css({ w: "2.5", h: "2.5" })}
											aria-hidden="true"
										/>
										<span
											className={css({
												fontSize: "9px",
												fontWeight: "semibold",
												textTransform: "uppercase",
												letterSpacing: "wide",
											})}
										>
											{t("photographerBadge")}
										</span>
									</div>
								)}
							</div>

							{/* Pasek akcji pod zdjęciem */}
							<div
								className={css({
									p: "2.5",
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									gap: "1",
									fontSize: "xs",
								})}
							>
								<span
									className={css({
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
										color: "slate.600",
										fontWeight: "medium",
										fontSize: "11px",
									})}
								>
									{item.uploaderName}
								</span>

								<ModerationActions
									status={item.status}
									toggleTitle={
										item.status === "ready" ? t("hideAction") : t("showAction")
									}
									toggleLabel={
										item.status === "ready"
											? t("hideAria", { name: item.originalFileName })
											: t("showAria", { name: item.originalFileName })
									}
									deleteTitle={t("deleteAction")}
									deleteLabel={t("deleteAria", { name: item.originalFileName })}
									onToggle={() => onToggleStatus(item.id, item.status)}
									onDelete={() => onDeleteMedia(item.id)}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
