"use client";

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
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				gap: "4",
			})}
		>
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
						pending: t("filterPending", {
							count: countByStatus(wishesList, "pending"),
						}),
					}}
				/>
			</div>

			{filteredWishes.length === 0 ? (
				<p
					className={css({
						fontSize: "xs",
						color: "slate.500",
						px: "1",
					})}
				>
					{t("noWishesOwner")}
				</p>
			) : (
				<ul
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "3",
					})}
				>
					{filteredWishes.map((wish) => {
						const isHidden = wish.status === "hidden";
						return (
							<li
								key={wish.id}
								className={css({
									position: "relative",
									bg: "white",
									borderRadius: "2xl",
									p: "4",
									borderWidth: "1px",
									borderStyle: isHidden ? "dashed" : "solid",
									borderColor: isHidden ? "red.300" : "slate.200",
									opacity: isHidden ? 0.7 : 1,
									boxShadow: "xs",
									transition: "all 0.2s ease",
								})}
							>
								<p
									className={css({
										fontSize: "sm",
										color: "wedding.slate",
										whiteSpace: "pre-wrap",
										wordBreak: "break-words",
										pr: "2",
									})}
								>
									{wish.message}
								</p>
								<div
									className={css({
										mt: "2.5",
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										gap: "2",
									})}
								>
									<span
										className={css({
											fontSize: "xs",
											fontWeight: "semibold",
											color: "wedding.gold",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										})}
									>
										{wish.guestName?.trim() || t("anonymousGuest")}
									</span>
									<div
										className={css({
											display: "flex",
											alignItems: "center",
											gap: "1",
											flexShrink: 0,
										})}
									>
										{isHidden && (
											<span
												className={css({
													fontSize: "10px",
													fontWeight: "bold",
													textTransform: "uppercase",
													letterSpacing: "wider",
													color: "red.700",
													bg: "red.50",
													px: "2",
													py: "0.5",
													borderRadius: "full",
													mr: "1",
												})}
											>
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
						);
					})}
				</ul>
			)}
		</div>
	);
};
