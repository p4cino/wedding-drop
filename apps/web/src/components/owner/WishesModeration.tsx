"use client";

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

export interface OwnerWishItem {
	id: string;
	guestName: string | null;
	message: string;
	status: ModerationStatus;
	createdAt: string;
}

interface WishesModerationProps {
	wishesList: OwnerWishItem[];
	onToggleStatus: (wishId: string, currentStatus: ModerationStatus) => void;
	onDeleteWish: (wishId: string) => void;
}

export const WishesModeration: React.FC<WishesModerationProps> = ({
	wishesList,
	onToggleStatus,
	onDeleteWish,
}) => {
	const t = useTranslations("Wishes");
	const [filter, setFilter] = useState<ModerationFilter>("all");
	const filteredWishes = filterByStatus(wishesList, filter);

	return (
		<div className="space-y-4">
			<div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
				<ModerationFilterBar
					value={filter}
					onChange={setFilter}
					groupLabel={t("moderationFilterAria")}
					title={t("moderationTitle")}
					labels={{
						all: t("filterAll", { count: wishesList.length }),
						ready: t("filterVisible", {
							count: countByStatus(wishesList, "ready"),
						}),
						hidden: t("filterHidden", {
							count: countByStatus(wishesList, "hidden"),
						}),
					}}
				/>
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
									<ModerationActions
										status={wish.status}
										toggleLabel={
											wish.status === "ready"
												? t("hideAction")
												: t("showAction")
										}
										deleteLabel={t("deleteAction")}
										onToggle={() => onToggleStatus(wish.id, wish.status)}
										onDelete={() => onDeleteWish(wish.id)}
									/>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};
