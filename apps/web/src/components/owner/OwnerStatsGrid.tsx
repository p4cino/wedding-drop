"use client";

import { Film, HardDrive, Images, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { formatMegabytes } from "@/lib/format";

interface OwnerStatsGridProps {
	imagesCount: number;
	videosCount: number;
	totalBytes: number;
	onRefresh: () => void;
}

function StatTile({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
			<div className="flex items-center gap-2 text-slate-600 text-xs font-medium mb-1">
				{icon}
				<span>{label}</span>
			</div>
			<p className="text-2xl font-bold text-slate-900">{value}</p>
		</div>
	);
}

const ICON_CLASS = "w-4 h-4 text-amber-600";

export const OwnerStatsGrid: React.FC<OwnerStatsGridProps> = ({
	imagesCount,
	videosCount,
	totalBytes,
	onRefresh,
}) => {
	const t = useTranslations("OwnerPanel");
	return (
		<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
			<StatTile
				icon={<Images className={ICON_CLASS} aria-hidden="true" />}
				label={t("photos")}
				value={imagesCount}
			/>
			<StatTile
				icon={<Film className={ICON_CLASS} aria-hidden="true" />}
				label={t("videos")}
				value={videosCount}
			/>
			<StatTile
				icon={<HardDrive className={ICON_CLASS} aria-hidden="true" />}
				label={t("storage")}
				value={t("storageUnit", { size: formatMegabytes(totalBytes) })}
			/>

			<div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
				<div>
					<div className="text-slate-600 text-xs font-medium mb-1">
						{t("galleryStatus")}
					</div>
					<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
						{t("statusActive")}
					</span>
				</div>
				<button
					type="button"
					onClick={onRefresh}
					title={t("refreshBtn")}
					aria-label={t("refreshAria")}
					className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
				>
					<RefreshCw className="w-4 h-4" aria-hidden="true" />
				</button>
			</div>
		</div>
	);
};
