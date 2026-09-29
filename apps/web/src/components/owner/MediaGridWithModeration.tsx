"use client";

import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
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
		<div className="space-y-4">
			{/* Pasek filtrowania i moderacji */}
			<div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
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
					}}
				/>

				<p className="text-xs text-slate-500">{t("hiddenHint")}</p>
			</div>

			{/* Siatka moderacji */}
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
				{filteredMedia.map((item) => (
					<div
						key={item.id}
						className={`relative bg-white rounded-2xl overflow-hidden border shadow-xs transition group ${
							item.status === "hidden"
								? "opacity-60 border-dashed border-red-300"
								: "border-slate-200"
						}`}
					>
						<div className="aspect-square relative overflow-hidden bg-slate-100">
							<img
								src={item.thumbUrl}
								alt={item.originalFileName}
								className="w-full h-full object-cover"
							/>
							{item.status === "hidden" && (
								<div className="absolute inset-0 bg-red-950/40 flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-wider">
									{t("hiddenOverlay")}
								</div>
							)}

							{item.source === "photographer" && (
								<div
									className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/90 backdrop-blur-md flex items-center gap-1 text-white shadow-sm"
									aria-label={t("photographerBadge")}
								>
									<Camera className="w-2.5 h-2.5" aria-hidden="true" />
									<span className="text-[9px] font-semibold uppercase tracking-wide">
										{t("photographerBadge")}
									</span>
								</div>
							)}
						</div>

						{/* Pasek akcji pod zdjęciem */}
						<div className="p-2.5 flex items-center justify-between gap-1 text-xs">
							<span className="truncate text-slate-600 font-medium text-[11px]">
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
				))}
			</div>
		</div>
	);
};
