"use client";

import { Plus, Sparkles, Target, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState } from "react";
import { css } from "styled-system/css";
import {
	DEFAULT_QUEST_TEMPLATES,
	generateQuestId,
	type QuestItem,
	type QuestsConfig,
} from "@/lib/photo-quests";

const MAX_QUESTS = 20;
const MIN_TITLE_LEN = 2;
const MAX_TITLE_LEN = 80;

interface PhotoQuestsPanelProps {
	questsConfig?: QuestsConfig | null;
	onSave: (questsConfig: QuestsConfig) => Promise<boolean>;
}

export const PhotoQuestsPanel: React.FC<PhotoQuestsPanelProps> = ({
	questsConfig,
	onSave,
}) => {
	const t = useTranslations("OwnerPanel");
	const [enabled, setEnabled] = useState<boolean>(
		questsConfig?.enabled ?? false,
	);
	const [items, setItems] = useState<QuestItem[]>(questsConfig?.items ?? []);
	const [customTitle, setCustomTitle] = useState("");
	const [validationError, setValidationError] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (questsConfig) {
			setEnabled(Boolean(questsConfig.enabled));
			setItems(Array.isArray(questsConfig.items) ? questsConfig.items : []);
		}
	}, [questsConfig]);

	const handleAddQuest = (rawTitle: string) => {
		setValidationError("");
		const title = rawTitle.trim();
		if (title.length < MIN_TITLE_LEN || title.length > MAX_TITLE_LEN) {
			setValidationError(t("questsValidationLength"));
			return false;
		}
		if (items.length >= MAX_QUESTS) {
			setValidationError(t("questsValidationMax"));
			return false;
		}
		if (
			items.some(
				(existing) => existing.title.toLowerCase() === title.toLowerCase(),
			)
		) {
			return false;
		}
		const id = generateQuestId(
			title,
			items.map((item) => item.id),
		);
		setItems((prev) => [...prev, { id, title }]);
		return true;
	};

	const handleAddCustom = () => {
		if (handleAddQuest(customTitle)) {
			setCustomTitle("");
		}
	};

	const handleRemoveQuest = (id: string) => {
		setValidationError("");
		setItems((prev) => prev.filter((item) => item.id !== id));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		await onSave({ enabled, items });
		setIsSaving(false);
	};

	return (
		<div
			className={css({
				bg: "white",
				borderRadius: "2xl",
				p: { base: "6", sm: "8" },
				borderWidth: "1px",
				borderColor: "slate.200",
				boxShadow: "sm",
			})}
		>
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "3",
					mb: "6",
				})}
			>
				<div
					className={css({
						p: "2.5",
						bg: "amber.50",
						color: "wedding.gold",
						borderRadius: "xl",
					})}
				>
					<Target className={css({ w: "5", h: "5" })} aria-hidden="true" />
				</div>
				<div>
					<h2
						className={css({
							fontSize: "lg",
							fontWeight: "semibold",
							color: "slate.900",
						})}
					>
						{t("questsPanelTitle")}
					</h2>
					<p className={css({ fontSize: "xs", color: "slate.500" })}>
						{t("questsPanelSubtitle")}
					</p>
				</div>
			</div>

			<form
				onSubmit={handleSubmit}
				className={css({
					display: "flex",
					flexDirection: "column",
					gap: "6",
				})}
			>
				{/* Włącznik funkcji Foto-Wyzwań */}
				<label
					className={css({
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						cursor: "pointer",
						p: "4",
						borderWidth: "1px",
						borderColor: "slate.200",
						borderRadius: "xl",
						transition: "border-color 0.2s ease",
						_hover: { borderColor: "wedding.gold" },
					})}
				>
					<div
						className={css({ display: "flex", alignItems: "center", gap: "3" })}
					>
						<Sparkles
							className={css({ w: "4", h: "4", color: "slate.400" })}
							aria-hidden="true"
						/>
						<div>
							<p
								className={css({
									fontSize: "sm",
									fontWeight: "medium",
									color: "slate.900",
								})}
							>
								{t("questsEnableLabel")}
							</p>
							<p className={css({ fontSize: "xs", color: "slate.500" })}>
								{t("questsEnableHint")}
							</p>
						</div>
					</div>
					<input
						type="checkbox"
						checked={enabled}
						onChange={(e) => setEnabled(e.target.checked)}
						className={css({ w: "4", h: "4", accentColor: "wedding.gold" })}
					/>
				</label>

				{/* Szybkie szablony */}
				<div>
					<p
						className={css({
							fontSize: "xs",
							fontWeight: "semibold",
							textTransform: "uppercase",
							letterSpacing: "wider",
							color: "slate.600",
							mb: "2.5",
						})}
					>
						{t("questsTemplatesLabel")}
					</p>
					<div
						className={css({
							display: "flex",
							flexWrap: "wrap",
							gap: "2",
						})}
					>
						{DEFAULT_QUEST_TEMPLATES.map((tpl) => {
							const localizedTitle = t(tpl.key);
							const titleToUse =
								localizedTitle === tpl.key ? tpl.defaultTitle : localizedTitle;
							const alreadyAdded = items.some(
								(item) =>
									item.title.toLowerCase() === titleToUse.toLowerCase() ||
									item.title.toLowerCase() === tpl.defaultTitle.toLowerCase(),
							);
							return (
								<button
									key={tpl.id}
									type="button"
									disabled={alreadyAdded || items.length >= MAX_QUESTS}
									onClick={() => handleAddQuest(titleToUse)}
									className={css({
										display: "inline-flex",
										alignItems: "center",
										gap: "1.5",
										px: "3",
										py: "1.5",
										borderRadius: "full",
										fontSize: "xs",
										fontWeight: "medium",
										borderWidth: "1px",
										borderColor: alreadyAdded ? "slate.200" : "amber.300",
										backgroundColor: alreadyAdded ? "slate.100" : "amber.50",
										color: alreadyAdded ? "slate.400" : "amber.900",
										cursor:
											alreadyAdded || items.length >= MAX_QUESTS
												? "not-allowed"
												: "pointer",
										transition: "all 0.15s ease",
										_hover: {
											backgroundColor: alreadyAdded ? "slate.100" : "amber.100",
										},
									})}
								>
									<Plus
										className={css({ w: "3", h: "3" })}
										aria-hidden="true"
									/>
									<span>{localizedTitle}</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* Dodawanie własnego wyzwania */}
				<div>
					<label
						htmlFor="custom-quest-input"
						className={css({
							display: "block",
							fontSize: "xs",
							fontWeight: "semibold",
							textTransform: "uppercase",
							letterSpacing: "wider",
							color: "slate.600",
							mb: "2",
						})}
					>
						{t("questsCustomLabel")}
					</label>
					<div
						className={css({
							display: "flex",
							gap: "2",
							flexWrap: { base: "wrap", sm: "nowrap" },
						})}
					>
						<input
							id="custom-quest-input"
							type="text"
							maxLength={MAX_TITLE_LEN}
							value={customTitle}
							onChange={(e) => setCustomTitle(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleAddCustom();
								}
							}}
							placeholder={t("questsCustomPlaceholder")}
							className={css({
								flex: "1",
								px: "4",
								py: "2.5",
								borderWidth: "1px",
								borderColor: "slate.200",
								borderRadius: "xl",
								fontSize: "sm",
								_focus: {
									outline: "none",
									borderColor: "wedding.gold",
								},
							})}
						/>
						<button
							type="button"
							onClick={handleAddCustom}
							disabled={items.length >= MAX_QUESTS}
							className={css({
								display: "inline-flex",
								alignItems: "center",
								gap: "1.5",
								px: "4",
								py: "2.5",
								borderRadius: "xl",
								fontSize: "sm",
								fontWeight: "semibold",
								bg: "amber.600",
								color: "white",
								cursor: items.length >= MAX_QUESTS ? "not-allowed" : "pointer",
								opacity: items.length >= MAX_QUESTS ? 0.5 : 1,
								_hover: { bg: "amber.700" },
							})}
						>
							<Plus className={css({ w: "4", h: "4" })} aria-hidden="true" />
							<span>{t("questsAddBtn")}</span>
						</button>
					</div>
					{validationError && (
						<p
							role="alert"
							className={css({
								fontSize: "xs",
								color: "red.600",
								mt: "1.5",
							})}
						>
							{validationError}
						</p>
					)}
				</div>

				{/* Lista aktywnych wyzwań */}
				<div>
					<p
						className={css({
							fontSize: "xs",
							fontWeight: "semibold",
							textTransform: "uppercase",
							letterSpacing: "wider",
							color: "slate.600",
							mb: "2.5",
						})}
					>
						{t("questsActiveListLabel", { count: items.length })}
					</p>
					{items.length === 0 ? (
						<p
							className={css({
								fontSize: "xs",
								color: "slate.500",
								p: "4",
								bg: "slate.50",
								borderRadius: "xl",
								textAlign: "center",
							})}
						>
							{t("questsEmptyHint")}
						</p>
					) : (
						<ul
							className={css({
								display: "flex",
								flexDirection: "column",
								gap: "2",
							})}
						>
							{items.map((quest) => (
								<li
									key={quest.id}
									className={css({
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										gap: "3",
										px: "3.5",
										py: "2.5",
										borderRadius: "xl",
										borderWidth: "1px",
										borderColor: "slate.200",
										bg: "slate.50",
									})}
								>
									<span
										className={css({
											display: "flex",
											alignItems: "center",
											gap: "2",
											fontSize: "sm",
											fontWeight: "medium",
											color: "slate.800",
										})}
									>
										<span aria-hidden="true">🎯</span>
										<span>{quest.title}</span>
									</span>
									<button
										type="button"
										onClick={() => handleRemoveQuest(quest.id)}
										aria-label={t("questsRemoveAria", { title: quest.title })}
										title={t("questsRemoveAria", { title: quest.title })}
										className={css({
											p: "1.5",
											borderRadius: "lg",
											color: "slate.400",
											cursor: "pointer",
											_hover: { color: "red.600", bg: "red.50" },
										})}
									>
										<Trash2
											className={css({ w: "4", h: "4" })}
											aria-hidden="true"
										/>
									</button>
								</li>
							))}
						</ul>
					)}
				</div>

				<div
					className={css({
						display: "flex",
						justifyContent: "flex-end",
					})}
				>
					<button
						type="submit"
						disabled={isSaving}
						className={css({
							bg: "slate.900",
							color: "white",
							px: "6",
							py: "2.5",
							borderRadius: "xl",
							fontSize: "sm",
							fontWeight: "semibold",
							transition: "all 0.2s ease",
							cursor: isSaving ? "not-allowed" : "pointer",
							opacity: isSaving ? 0.7 : 1,
							_hover: { bg: "slate.800" },
						})}
					>
						{isSaving ? t("savingSettings") : t("questsSaveBtn")}
					</button>
				</div>
			</form>
		</div>
	);
};
