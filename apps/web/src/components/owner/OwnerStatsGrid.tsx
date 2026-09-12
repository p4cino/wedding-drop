"use client";

import { Film, HardDrive, Images, RefreshCw } from "lucide-react";
import type React from "react";

interface OwnerStatsGridProps {
	imagesCount: number;
	videosCount: number;
	totalMegabytes: string;
	onRefresh: () => void;
}

export const OwnerStatsGrid: React.FC<OwnerStatsGridProps> = ({
	imagesCount,
	videosCount,
	totalMegabytes,
	onRefresh,
}) => {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
			<div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
				<div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
					<Images className="w-4 h-4 text-amber-600" />
					<span>Zdjęcia</span>
				</div>
				<p className="text-2xl font-bold text-slate-900">{imagesCount}</p>
			</div>

			<div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
				<div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
					<Film className="w-4 h-4 text-amber-600" />
					<span>Filmy</span>
				</div>
				<p className="text-2xl font-bold text-slate-900">{videosCount}</p>
			</div>

			<div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
				<div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
					<HardDrive className="w-4 h-4 text-amber-600" />
					<span>Zajęte miejsce</span>
				</div>
				<p className="text-2xl font-bold text-slate-900">{totalMegabytes} MB</p>
			</div>

			<div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
				<div>
					<div className="text-slate-400 text-xs font-medium mb-1">
						Status galerii
					</div>
					<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
						Aktywna
					</span>
				</div>
				<button
					type="button"
					onClick={onRefresh}
					title="Odśwież"
					className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition"
				>
					<RefreshCw className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
};
