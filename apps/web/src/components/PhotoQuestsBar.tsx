"use client";

import { Camera, CheckCircle2, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { css } from "styled-system/css";
import type { MediaItemData } from "@/lib/gallery-types";
import {
	countMediaByQuest,
	getActiveQuests,
	type QuestsConfig,
} from "@/lib/photo-quests";

interface PhotoQuestsBarProps {
	questsConfig?: QuestsConfig | null;
	items: MediaItemData[];
	selectedQuestId: string | null;
	onSelectQuest: (questId: string | null) => void;
	onUploadForQuest?: (questId: string) => void;
	allowUploads?: boolean;
}

export default function PhotoQuestsBar({
	questsConfig,
	items,
	selectedQuestId,
	onSelectQuest,
	onUploadForQuest,
	allowUploads = true,
}: PhotoQuestsBarProps) {
	const t = useTranslations("GuestGallery");
	const activeQuests = useMemo(
		() => getActiveQuests(questsConfig),
		[questsConfig],
	);
	const counts = useMemo(() => countMediaByQuest(items), [items]);

	if (activeQuests.length === 0) {
		return null;
	}

	const targetQuestForUpload = selectedQuestId ?? activeQuests[0]?.id ?? null;

	return (
		<section
			aria-label={t("questsTitle")}
			className={css({
				mb: "6",
				bg: "white",
				borderRadius: "2xl",
				borderWidth: "1px",
				borderColor: "amber.200",
				boxShadow: "xs",
				p: { base: "4", sm: "5" },
			})}
		>
			<div
				className={css({
					display: "flex",
					flexWrap: "wrap",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "3",
					mb: "3.5",
				})}
			>
				<div>
					<h2
						className={css({
							display: "flex",
							alignItems: "center",
							gap: "2",
							fontSize: "sm",
							fontWeight: "bold",
							color: "slate.900",
						})}
					>
						<Target
							className={css({ w: "4", h: "4", color: "amber.600" })}
							aria-hidden="true"
						/>
						<span>{t("questsTitle")}</span>
					</h2>
					<p
						className={css({
							fontSize: "xs",
							color: "slate.500",
							mt: "0.5",
						})}
					>
						{t("questsSubtitle")}
					</p>
				</div>

				{allowUploads && onUploadForQuest && targetQuestForUpload && (
					<button
						type="button"
						onClick={() => onUploadForQuest(targetQuestForUpload)}
						className={css({
							display: "inline-flex",
							alignItems: "center",
							gap: "1.5",
							px: "3.5",
							py: "2",
							borderRadius: "xl",
							fontSize: "xs",
							fontWeight: "semibold",
							bg: "amber.600",
							color: "white",
							borderWidth: "0",
							cursor: "pointer",
							transition: "all 0.15s ease",
							_hover: { bg: "amber.700" },
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "amber.500",
							},
						})}
					>
						<Camera
							className={css({ w: "3.5", h: "3.5" })}
							aria-hidden="true"
						/>
						<span>{t("questUploadBtn")}</span>
					</button>
				)}
			</div>

			<div
				className={css({
					display: "flex",
					flexWrap: "wrap",
					gap: "2",
				})}
			>
				<button
					type="button"
					aria-pressed={selectedQuestId === null}
					onClick={() => onSelectQuest(null)}
					className={css({
						display: "inline-flex",
						alignItems: "center",
						gap: "1.5",
						px: "3",
						py: "1.5",
						borderRadius: "full",
						fontSize: "xs",
						fontWeight: "semibold",
						cursor: "pointer",
						borderWidth: "1px",
						transition: "all 0.15s ease",
						backgroundColor:
							selectedQuestId === null ? "slate.900" : "slate.50",
						borderColor: selectedQuestId === null ? "slate.900" : "slate.200",
						color: selectedQuestId === null ? "white" : "slate.700",
						_hover: {
							borderColor: selectedQuestId === null ? "slate.900" : "amber.400",
						},
						_focusVisible: {
							outline: "2px solid",
							outlineColor: "wedding.gold",
						},
					})}
				>
					<span>{t("questsAllFilter")}</span>
				</button>

				{activeQuests.map((quest) => {
					const count = counts[quest.id] ?? 0;
					const isSelected = selectedQuestId === quest.id;
					const isCompleted = count > 0;

					return (
						<button
							key={quest.id}
							type="button"
							aria-pressed={isSelected}
							onClick={() => onSelectQuest(isSelected ? null : quest.id)}
							className={css({
								display: "inline-flex",
								alignItems: "center",
								gap: "1.5",
								px: "3",
								py: "1.5",
								borderRadius: "full",
								fontSize: "xs",
								fontWeight: "semibold",
								cursor: "pointer",
								borderWidth: "1px",
								transition: "all 0.15s ease",
								backgroundColor: isSelected
									? "amber.600"
									: isCompleted
										? "amber.50"
										: "white",
								borderColor: isSelected
									? "amber.600"
									: isCompleted
										? "amber.300"
										: "slate.200",
								color: isSelected
									? "white"
									: isCompleted
										? "amber.900"
										: "slate.700",
								_hover: {
									borderColor: isSelected ? "amber.700" : "amber.400",
								},
								_focusVisible: {
									outline: "2px solid",
									outlineColor: "wedding.gold",
								},
							})}
						>
							<span aria-hidden="true">🎯</span>
							<span>{quest.title}</span>
							<span
								className={css({
									display: "inline-flex",
									alignItems: "center",
									gap: "0.5",
									px: "1.5",
									py: "0.5",
									borderRadius: "full",
									fontSize: "10px",
									fontWeight: "bold",
									backgroundColor: isSelected
										? "rgba(255, 255, 255, 0.25)"
										: isCompleted
											? "amber.200"
											: "slate.100",
									color: isSelected
										? "white"
										: isCompleted
											? "amber.900"
											: "slate.600",
								})}
							>
								{isCompleted && (
									<CheckCircle2
										className={css({ w: "2.5", h: "2.5" })}
										aria-hidden="true"
									/>
								)}
								{count}
							</span>
						</button>
					);
				})}
			</div>
		</section>
	);
}
