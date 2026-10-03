"use client";

import { Cloud, Loader2, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useRef, useState } from "react";
import { css } from "styled-system/css";
import { Button } from "@/components/ui/button";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface GDriveExportModalProps {
	isOpen: boolean;
	coupleNames: string;
	onClose: () => void;
	/** Uruchamia eksport; zwraca `true` po sukcesie (wtedy modal się zamyka). */
	onStartExport: (includeHidden: boolean) => Promise<boolean>;
}

export const GDriveExportModal: React.FC<GDriveExportModalProps> = ({
	isOpen,
	coupleNames,
	onClose,
	onStartExport,
}) => {
	const t = useTranslations("OwnerPanel");
	const [includeHidden, setIncludeHidden] = useState(true);
	const [exportLoading, setExportLoading] = useState(false);

	const handleStart = async () => {
		setExportLoading(true);
		try {
			if (await onStartExport(includeHidden)) onClose();
		} finally {
			setExportLoading(false);
		}
	};

	const dialogRef = useRef<HTMLDivElement>(null);
	useEscapeKey(isOpen && !exportLoading, onClose);
	useFocusTrap(dialogRef, isOpen);

	if (!isOpen) return null;

	return (
		<div
			ref={dialogRef}
			role="dialog"
			aria-modal="true"
			aria-labelledby="gdrive-export-modal-title"
			className={css({
				position: "fixed",
				inset: "0",
				zIndex: "50",
				backgroundColor: "rgba(15, 23, 42, 0.4)",
				backdropFilter: "blur(4px)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				p: "4",
			})}
		>
			<div
				className={css({
					backgroundColor: "white",
					borderRadius: "3xl",
					p: { base: "6", sm: "8" },
					maxW: "md",
					w: "full",
					boxShadow: "2xl",
					borderWidth: "1px",
					borderColor: "slate.100",
					display: "flex",
					flexDirection: "column",
					gap: "5",
				})}
			>
				<div
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "3",
					})}
				>
					<div
						className={css({
							w: "10",
							h: "10",
							borderRadius: "xl",
							backgroundColor: "amber.100",
							color: "amber.800",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexShrink: 0,
						})}
					>
						<Cloud className={css({ w: "5", h: "5" })} aria-hidden="true" />
					</div>
					<div>
						<h3
							id="gdrive-export-modal-title"
							className={css({
								fontSize: "base",
								fontWeight: "bold",
								color: "wedding.slate",
							})}
						>
							{t("modalTitle")}
						</h3>
						<p className={css({ fontSize: "xs", color: "slate.500" })}>
							{t("modalSubtitle")}
						</p>
					</div>
				</div>

				<fieldset
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "3",
						fontSize: "xs",
						borderWidth: "0",
						p: "0",
						m: "0",
					})}
				>
					<legend
						className={css({
							position: "absolute",
							width: "1px",
							height: "1px",
							padding: "0",
							margin: "-1px",
							overflow: "hidden",
							clip: "rect(0, 0, 0, 0)",
							whiteSpace: "nowrap",
							borderWidth: "0",
						})}
					>
						{t("scopeAria")}
					</legend>

					<label
						className={css({
							display: "flex",
							alignItems: "flex-start",
							gap: "3",
							p: "3.5",
							borderRadius: "2xl",
							borderWidth: "1px",
							borderColor: "slate.200",
							cursor: "pointer",
							transition: "all 0.15s ease",
							_hover: { backgroundColor: "slate.50" },
						})}
					>
						<input
							type="radio"
							name="export_scope"
							checked={includeHidden}
							onChange={() => setIncludeHidden(true)}
							className={css({ mt: "0.5" })}
						/>
						<div>
							<span
								className={css({
									fontWeight: "semibold",
									color: "wedding.slate",
									display: "block",
								})}
							>
								{t("scopeAll")}
							</span>
							<span
								className={css({
									color: "slate.500",
									display: "block",
									mt: "0.5",
								})}
							>
								{t("scopeAllDesc1")}
								<strong>{t("hiddenOverlay")}</strong> {t("scopeAllDesc2")}
							</span>
						</div>
					</label>

					<label
						className={css({
							display: "flex",
							alignItems: "flex-start",
							gap: "3",
							p: "3.5",
							borderRadius: "2xl",
							borderWidth: "1px",
							borderColor: "slate.200",
							cursor: "pointer",
							transition: "all 0.15s ease",
							_hover: { backgroundColor: "slate.50" },
						})}
					>
						<input
							type="radio"
							name="export_scope"
							checked={!includeHidden}
							onChange={() => setIncludeHidden(false)}
							className={css({ mt: "0.5" })}
						/>
						<div>
							<span
								className={css({
									fontWeight: "semibold",
									color: "wedding.slate",
									display: "block",
								})}
							>
								{t("scopeVisible")}
							</span>
							<span
								className={css({
									color: "slate.500",
									display: "block",
									mt: "0.5",
								})}
							>
								{t("scopeVisibleDesc")}
							</span>
						</div>
					</label>
				</fieldset>

				<div
					className={css({
						p: "3",
						backgroundColor: "slate.50",
						borderRadius: "xl",
						fontSize: "11px",
						color: "slate.600",
						display: "flex",
						flexDirection: "column",
						gap: "1",
					})}
				>
					<p>
						{t("folderNote")}
						<br />
						<span
							className={css({
								fontFamily: "mono",
								fontWeight: "semibold",
								color: "wedding.slate",
							})}
						>
							WeddingDrop - {coupleNames || t("defaultCouple")}
						</span>
					</p>
					<p className={css({ color: "slate.500" })}>{t("folderNote2")}</p>
				</div>

				<div
					className={css({
						display: "flex",
						alignItems: "center",
						justifyContent: "flex-end",
						gap: "2",
						pt: "2",
					})}
				>
					<Button
						type="button"
						variant="ghost"
						onClick={onClose}
						disabled={exportLoading}
						className={css({
							px: "4",
							py: "2.5",
							borderRadius: "xl",
							fontSize: "xs",
							fontWeight: "semibold",
							color: "slate.600",
							_hover: { backgroundColor: "slate.100" },
							cursor: "pointer",
						})}
					>
						{t("cancelBtn")}
					</Button>
					<Button
						type="button"
						onClick={handleStart}
						disabled={exportLoading}
						className={css({
							display: "inline-flex",
							alignItems: "center",
							gap: "2",
							px: "5",
							py: "2.5",
							borderRadius: "xl",
							fontSize: "xs",
							fontWeight: "bold",
							backgroundColor: "emerald.600",
							_hover: { backgroundColor: "emerald.700" },
							color: "white",
							boxShadow: "sm",
							cursor: "pointer",
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "emerald.500",
							},
						})}
					>
						{exportLoading ? (
							<>
								<Loader2
									className={css({
										w: "3.5",
										h: "3.5",
										animation: "spin 1s linear infinite",
									})}
									aria-hidden="true"
								/>
								<span>{t("initBtn")}</span>
							</>
						) : (
							<>
								<Play
									className={css({ w: "3.5", h: "3.5" })}
									aria-hidden="true"
								/>
								<span>{t("startBtn")}</span>
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
	);
};
