"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import type React from "react";

export interface OwnerMediaItem {
	id: string;
	uploaderName: string;
	fileType: "image" | "video";
	originalFileName: string;
	fileSize: number;
	thumbUrl: string;
	rawUrl: string;
	status: "ready" | "hidden";
	createdAt: string;
}

interface MediaGridWithModerationProps {
	mediaList: OwnerMediaItem[];
	filter: "all" | "ready" | "hidden";
	setFilter: (filter: "all" | "ready" | "hidden") => void;
	onToggleStatus: (mediaId: string, currentStatus: string) => void;
	onDeleteMedia: (mediaId: string) => void;
}

export const MediaGridWithModeration: React.FC<
	MediaGridWithModerationProps
> = ({ mediaList, filter, setFilter, onToggleStatus, onDeleteMedia }) => {
	const filteredMedia = mediaList.filter((m) => {
		if (filter === "ready") return m.status === "ready";
		if (filter === "hidden") return m.status === "hidden";
		return true;
	});

	return (
		<div className="space-y-4">
			{/* Pasek filtrowania i moderacji */}
			<div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
				<div
					role="group"
					aria-label="Filtrowanie multimediów"
					className="flex items-center gap-2 text-xs font-medium"
				>
					<span className="text-slate-600 mr-1 font-semibold">Filtruj:</span>
					<button
						type="button"
						onClick={() => setFilter("all")}
						aria-pressed={filter === "all"}
						className={`px-3 py-1.5 rounded-xl transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
							filter === "all"
								? "bg-slate-900 text-white"
								: "bg-slate-100 text-slate-600 hover:bg-slate-200"
						}`}
					>
						Wszystkie ({mediaList.length})
					</button>
					<button
						type="button"
						onClick={() => setFilter("ready")}
						aria-pressed={filter === "ready"}
						className={`px-3 py-1.5 rounded-xl transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
							filter === "ready"
								? "bg-slate-900 text-white"
								: "bg-slate-100 text-slate-600 hover:bg-slate-200"
						}`}
					>
						Widoczne ({mediaList.filter((m) => m.status === "ready").length})
					</button>
					<button
						type="button"
						onClick={() => setFilter("hidden")}
						aria-pressed={filter === "hidden"}
						className={`px-3 py-1.5 rounded-xl transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
							filter === "hidden"
								? "bg-slate-900 text-white"
								: "bg-slate-100 text-slate-600 hover:bg-slate-200"
						}`}
					>
						Ukryte ({mediaList.filter((m) => m.status === "hidden").length})
					</button>
				</div>

				<p className="text-xs text-slate-500">
					Kliknij ikonę oka, aby ukryć zdjęcie przed gośćmi (będzie widoczne
					tylko dla Was w ZIP i na Dysku Google).
				</p>
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
									Ukryte
								</div>
							)}
						</div>

						{/* Pasek akcji pod zdjęciem */}
						<div className="p-2.5 flex items-center justify-between gap-1 text-xs">
							<span className="truncate text-slate-600 font-medium text-[11px]">
								{item.uploaderName}
							</span>

							<div className="flex items-center gap-1 shrink-0">
								<button
									type="button"
									onClick={() => onToggleStatus(item.id, item.status)}
									title={
										item.status === "ready"
											? "Ukryj przed gośćmi"
											: "Pokaż w galerii"
									}
									aria-label={
										item.status === "ready"
											? `Ukryj plik ${item.originalFileName} przed gośćmi`
											: `Pokaż plik ${item.originalFileName} w galerii`
									}
									className={`p-1.5 rounded-lg transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
										item.status === "ready"
											? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
											: "text-amber-600 bg-amber-50 hover:bg-amber-100"
									}`}
								>
									{item.status === "ready" ? (
										<Eye className="w-3.5 h-3.5" aria-hidden="true" />
									) : (
										<EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
									)}
								</button>

								<button
									type="button"
									onClick={() => onDeleteMedia(item.id)}
									title="Usuń bezpowrotnie"
									aria-label={`Usuń bezpowrotnie plik ${item.originalFileName}`}
									className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
								>
									<Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
								</button>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
