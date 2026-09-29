"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";

export interface OwnerWishItem {
	id: string;
	guestName: string | null;
	message: string;
	status: "ready" | "hidden";
	createdAt: string;
}

interface WishesModerationProps {
	wishesList: OwnerWishItem[];
	filter: "all" | "ready" | "hidden";
	setFilter: (filter: "all" | "ready" | "hidden") => void;
	onToggleStatus: (wishId: string, currentStatus: string) => void;
	onDeleteWish: (wishId: string) => void;
}

export const WishesModeration: React.FC<WishesModerationProps> = ({
	wishesList,
	filter,
	setFilter,
	onToggleStatus,
	onDeleteWish,
}) => {
	const t = useTranslations("Wishes");
	const filteredWishes = wishesList.filter((w) => {
		if (filter === "ready") return w.status === "ready";
		if (filter === "hidden") return w.status === "hidden";
		return true;
	});

	return (
		<div className="space-y-4">
			<div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
				<div
					role="group"
					aria-label={t("moderationFilterAria")}
					className="flex items-center gap-2 text-xs font-medium"
				>
					<span className="text-slate-600 mr-1 font-semibold">
						{t("moderationTitle")}
					</span>
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
						{t("filterAll", { count: wishesList.length })}
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
						{t("filterVisible", {
							count: wishesList.filter((w) => w.status === "ready").length,
						})}
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
						{t("filterHidden", {
							count: wishesList.filter((w) => w.status === "hidden").length,
						})}
					</button>
				</div>
			</div>

			{filteredWishes.length === 0 ? (
				<p className="text-xs text-slate-500 px-1">{t("noWishesOwner")}</p>
			) : (
				<ul className="space-y-3">
					{filteredWishes.map((wish) => (
						<li
							key={wish.id}
							className={`relative bg-white rounded-2xl p-4 border shadow-xs transition ${
								wish.status === "hidden"
									? "opacity-70 border-dashed border-red-300"
									: "border-slate-200"
							}`}
						>
							<p className="text-sm text-slate-800 whitespace-pre-wrap break-words pr-2">
								{wish.message}
							</p>
							<div className="mt-2.5 flex items-center justify-between gap-2">
								<span className="text-xs font-semibold text-amber-700 truncate">
									{wish.guestName?.trim() || t("anonymousGuest")}
								</span>
								<div className="flex items-center gap-1 shrink-0">
									{wish.status === "hidden" && (
										<span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded-full mr-1">
											{t("hiddenOverlay")}
										</span>
									)}
									<button
										type="button"
										onClick={() => onToggleStatus(wish.id, wish.status)}
										title={
											wish.status === "ready"
												? t("hideAction")
												: t("showAction")
										}
										aria-label={
											wish.status === "ready"
												? t("hideAction")
												: t("showAction")
										}
										className={`p-1.5 rounded-lg transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
											wish.status === "ready"
												? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
												: "text-amber-600 bg-amber-50 hover:bg-amber-100"
										}`}
									>
										{wish.status === "ready" ? (
											<Eye className="w-3.5 h-3.5" aria-hidden="true" />
										) : (
											<EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
										)}
									</button>

									<button
										type="button"
										onClick={() => onDeleteWish(wish.id)}
										title={t("deleteAction")}
										aria-label={t("deleteAction")}
										className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
									>
										<Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
									</button>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};
