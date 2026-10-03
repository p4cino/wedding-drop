"use client";

import {
	AlertCircle,
	AlertTriangle,
	ArrowUpRight,
	CheckCircle2,
	Cloud,
	Loader2,
	Play,
	Unlink,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { css } from "styled-system/css";
import NewTabLabel from "@/components/NewTabLabel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMegabytes } from "@/lib/format";
import type { GDriveState } from "@/lib/owner-types";

interface GDriveBackupCardProps {
	state: GDriveState;
	onConnect: () => void;
	onDisconnect: () => void;
	onOpenExportModal: () => void;
}

export const GDriveBackupCard: React.FC<GDriveBackupCardProps> = ({
	state,
	onConnect,
	onDisconnect,
	onOpenExportModal,
}) => {
	const {
		connected: hasGDrive,
		email: gdriveEmail,
		status: gdriveStatus,
		progress: gdriveProgress,
		folderId: gdriveFolderId,
		exportedAt: gdriveExportedAt,
		isConfigured: isGDriveConfigured,
	} = state;
	const progressPercent =
		gdriveProgress?.totalFiles && gdriveProgress?.totalFiles > 0
			? Math.min(
					100,
					Math.round(
						((gdriveProgress.processedFiles ?? 0) / gdriveProgress.totalFiles) *
							100,
					),
				)
			: 0;

	const processedMB = formatMegabytes(gdriveProgress?.processedBytes ?? 0);
	const totalProgMB = formatMegabytes(gdriveProgress?.totalBytes ?? 0);
	const t = useTranslations("OwnerPanel");

	return (
		<div
			className={css({
				backgroundColor: "white",
				borderRadius: "3xl",
				borderWidth: "1px",
				borderColor: "slate.200",
				boxShadow: "sm",
				overflow: "hidden",
			})}
		>
			<div
				className={css({
					p: { base: "6", sm: "8" },
					display: "flex",
					flexDirection: { base: "column", md: "row" },
					alignItems: { base: "stretch", md: "center" },
					justifyContent: "space-between",
					gap: "6",
					background:
						"linear-gradient(to right, rgba(245, 158, 11, 0.05), rgba(254, 243, 199, 0.2), transparent)",
					borderBottomWidth: "1px",
					borderBottomColor: "slate.100",
				})}
			>
				<div
					className={css({
						display: "flex",
						alignItems: "flex-start",
						gap: "4",
					})}
				>
					<div
						className={css({
							w: "12",
							h: "12",
							borderRadius: "2xl",
							backgroundColor: "amber.100",
							color: "amber.800",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexShrink: 0,
							boxShadow: "xs",
						})}
					>
						<Cloud className={css({ w: "6", h: "6" })} />
					</div>
					<div>
						<div
							className={css({
								display: "flex",
								alignItems: "center",
								gap: "2",
								mb: "1",
								flexWrap: "wrap",
							})}
						>
							<h2
								className={css({
									fontSize: "lg",
									fontWeight: "bold",
									color: "wedding.slate",
									fontFamily: "serif",
								})}
							>
								{t("gdriveCardTitle")}
							</h2>
							{hasGDrive ? (
								<Badge
									size="sm"
									className={css({
										display: "inline-flex",
										alignItems: "center",
										gap: "1",
										px: "2.5",
										py: "0.5",
										borderRadius: "full",
										fontSize: "11px",
										fontWeight: "semibold",
										backgroundColor: "emerald.100",
										color: "emerald.800",
									})}
								>
									<CheckCircle2 className={css({ w: "3", h: "3" })} />
									{t("connected", {
										email: gdriveEmail || t("defaultAccount"),
									})}
								</Badge>
							) : (
								<Badge
									size="sm"
									className={css({
										display: "inline-flex",
										alignItems: "center",
										gap: "1",
										px: "2.5",
										py: "0.5",
										borderRadius: "full",
										fontSize: "11px",
										fontWeight: "semibold",
										backgroundColor: "slate.100",
										color: "slate.600",
									})}
								>
									{t("notConnected")}
								</Badge>
							)}
						</div>
						<p
							className={css({
								fontSize: "xs",
								color: "slate.500",
								maxW: "xl",
							})}
						>
							{t("gdriveDesc")}
						</p>
					</div>
				</div>

				{/* Przyciski główne akcji */}
				<div
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "3",
						flexShrink: 0,
						flexWrap: "wrap",
					})}
				>
					{!hasGDrive ? (
						<Button
							type="button"
							onClick={onConnect}
							disabled={!isGDriveConfigured}
							className={css({
								display: "inline-flex",
								alignItems: "center",
								gap: "2",
								px: "5",
								py: "3",
								borderRadius: "2xl",
								fontSize: "xs",
								fontWeight: "bold",
								boxShadow: "sm",
								transition: "all 0.15s ease",
								cursor: isGDriveConfigured ? "pointer" : "not-allowed",
								backgroundColor: isGDriveConfigured ? "slate.900" : "slate.200",
								color: isGDriveConfigured ? "white" : "slate.400",
								_hover: {
									backgroundColor: isGDriveConfigured
										? "slate.800"
										: "slate.200",
								},
							})}
						>
							<Cloud className={css({ w: "4", h: "4" })} aria-hidden="true" />
							<span>{t("connectBtn")}</span>
						</Button>
					) : (
						<div
							className={css({
								display: "flex",
								alignItems: "center",
								gap: "2",
								flexWrap: "wrap",
							})}
						>
							{gdriveFolderId && (
								<a
									href={`https://drive.google.com/drive/folders/${gdriveFolderId}`}
									target="_blank"
									rel="noopener noreferrer"
									className={css({
										display: "inline-flex",
										alignItems: "center",
										gap: "1.5",
										px: "4",
										py: "2.5",
										borderRadius: "xl",
										fontSize: "xs",
										fontWeight: "bold",
										backgroundColor: "amber.50",
										color: "amber.900",
										borderWidth: "1px",
										borderColor: "amber.200",
										textDecoration: "none",
										transition: "all 0.15s ease",
										_hover: { backgroundColor: "amber.100" },
										_focusVisible: {
											outline: "2px solid",
											outlineColor: "wedding.gold",
										},
									})}
								>
									<ArrowUpRight
										className={css({ w: "4", h: "4" })}
										aria-hidden="true"
									/>
									<span>{t("openFolder")}</span>
									<NewTabLabel />
								</a>
							)}

							<Button
								type="button"
								onClick={onOpenExportModal}
								disabled={gdriveStatus === "running"}
								className={css({
									display: "inline-flex",
									alignItems: "center",
									gap: "2",
									px: "5",
									py: "2.5",
									borderRadius: "xl",
									fontSize: "xs",
									fontWeight: "bold",
									boxShadow: "sm",
									transition: "all 0.15s ease",
									cursor:
										gdriveStatus === "running" ? "not-allowed" : "pointer",
									backgroundColor:
										gdriveStatus === "running" ? "slate.200" : "emerald.600",
									color: gdriveStatus === "running" ? "slate.400" : "white",
									_hover: {
										backgroundColor:
											gdriveStatus === "running" ? "slate.200" : "emerald.700",
									},
								})}
							>
								{gdriveStatus === "running" ? (
									<>
										<Loader2
											className={css({
												w: "4",
												h: "4",
												animation: "spin 1s linear infinite",
											})}
											aria-hidden="true"
										/>
										<span>{t("exporting")}</span>
									</>
								) : (
									<>
										<Play
											className={css({ w: "3.5", h: "3.5" })}
											aria-hidden="true"
										/>
										<span>
											{gdriveStatus === "interrupted"
												? t("resumeExport")
												: t("startExportBtn")}
										</span>
									</>
								)}
							</Button>

							<button
								type="button"
								onClick={onDisconnect}
								title={t("disconnectBtn")}
								aria-label={t("disconnectBtn")}
								className={css({
									p: "2.5",
									borderRadius: "xl",
									color: "slate.600",
									backgroundColor: "transparent",
									borderWidth: "0",
									cursor: "pointer",
									transition: "all 0.15s ease",
									_hover: {
										color: "red.600",
										backgroundColor: "red.50",
									},
									_focusVisible: {
										outline: "2px solid",
										outlineColor: "red.500",
									},
								})}
							>
								<Unlink
									className={css({ w: "4", h: "4" })}
									aria-hidden="true"
								/>
							</button>
						</div>
					)}
				</div>
			</div>

			{!isGDriveConfigured && !hasGDrive && (
				<div
					className={css({
						p: "4",
						backgroundColor: "rgba(254, 243, 199, 0.6)",
						borderTopWidth: "1px",
						borderTopColor: "rgba(253, 230, 138, 0.6)",
						fontSize: "xs",
						color: "amber.800",
						display: "flex",
						alignItems: "center",
						gap: "2",
					})}
				>
					<AlertTriangle
						className={css({
							w: "4",
							h: "4",
							color: "amber.600",
							flexShrink: 0,
						})}
						aria-hidden="true"
					/>
					<span>{t("envWarning")}</span>
				</div>
			)}

			{/* Podgląd stanu i paska postępu eksportu */}
			{hasGDrive && (
				<div
					className={css({
						p: { base: "6", sm: "8" },
						display: "flex",
						flexDirection: "column",
						gap: "4",
					})}
				>
					{gdriveStatus === "running" && (
						<div
							className={css({
								p: "5",
								borderRadius: "2xl",
								backgroundColor: "rgba(254, 243, 199, 0.8)",
								borderWidth: "1px",
								borderColor: "amber.200",
								display: "flex",
								flexDirection: "column",
								gap: "3",
							})}
							aria-live="polite"
						>
							<div
								className={css({
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									fontSize: "xs",
									fontWeight: "semibold",
									color: "amber.900",
								})}
							>
								<span
									className={css({
										display: "flex",
										alignItems: "center",
										gap: "2",
									})}
								>
									<Loader2
										className={css({
											w: "4",
											h: "4",
											animation: "spin 1s linear infinite",
											color: "amber.700",
										})}
										aria-hidden="true"
									/>
									{t("exportProgressTitle")}
								</span>
								<span>
									{t("filesCount", {
										processed: gdriveProgress?.processedFiles || 0,
										total: gdriveProgress?.totalFiles || 0,
										percent: progressPercent,
									})}
								</span>
							</div>

							{/* Pasek postępu */}
							<div
								role="progressbar"
								aria-valuenow={progressPercent}
								aria-valuemin={0}
								aria-valuemax={100}
								aria-label={t("progressAria")}
								className={css({
									w: "full",
									h: "3",
									backgroundColor: "rgba(253, 230, 138, 0.7)",
									borderRadius: "full",
									overflow: "hidden",
								})}
							>
								<div
									className={css({
										h: "full",
										backgroundColor: "amber.600",
										transition: "all 0.5s ease",
										borderRadius: "full",
									})}
									style={{ width: `${progressPercent}%` }}
								/>
							</div>

							<div
								className={css({
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									fontSize: "11px",
									color: "rgba(146, 64, 14, 0.8)",
								})}
							>
								<span
									className={css({
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
										maxW: "md",
									})}
								>
									{gdriveProgress?.currentFile
										? t("uploadingFile", { file: gdriveProgress.currentFile })
										: t("processing")}
								</span>
								<span>
									{processedMB} MB / {totalProgMB} MB
								</span>
							</div>

							<p
								className={css({
									fontSize: "11px",
									color: "rgba(180, 83, 9, 0.7)",
									fontStyle: "italic",
								})}
							>
								{t("backgroundNote")}
							</p>
						</div>
					)}

					{gdriveStatus === "interrupted" && (
						<div
							className={css({
								p: "4",
								borderRadius: "2xl",
								backgroundColor: "orange.50",
								borderWidth: "1px",
								borderColor: "orange.200",
								display: "flex",
								alignItems: "flex-start",
								justifyContent: "space-between",
								gap: "4",
							})}
						>
							<div
								className={css({
									display: "flex",
									alignItems: "flex-start",
									gap: "3",
								})}
							>
								<AlertTriangle
									className={css({
										w: "5",
										h: "5",
										color: "orange.600",
										flexShrink: 0,
										mt: "0.5",
									})}
									aria-hidden="true"
								/>
								<div>
									<h3
										className={css({
											fontSize: "xs",
											fontWeight: "bold",
											color: "orange.900",
										})}
									>
										{t("interruptedTitle")}
									</h3>
									<p
										className={css({
											fontSize: "xs",
											color: "orange.700",
											mt: "0.5",
										})}
									>
										{t("interruptedDesc")}
									</p>
								</div>
							</div>
						</div>
					)}

					{gdriveStatus === "failed" && (
						<div
							className={css({
								p: "4",
								borderRadius: "2xl",
								backgroundColor: "red.50",
								borderWidth: "1px",
								borderColor: "red.200",
								display: "flex",
								alignItems: "flex-start",
								gap: "3",
							})}
							role="alert"
						>
							<AlertCircle
								className={css({
									w: "5",
									h: "5",
									color: "red.600",
									flexShrink: 0,
									mt: "0.5",
								})}
								aria-hidden="true"
							/>
							<div>
								<h3
									className={css({
										fontSize: "xs",
										fontWeight: "bold",
										color: "red.900",
									})}
								>
									{t("failedTitle")}
								</h3>
								<p
									className={css({
										fontSize: "xs",
										color: "red.700",
										mt: "0.5",
									})}
								>
									{gdriveProgress?.error || t("defaultError")}
								</p>
							</div>
						</div>
					)}

					{gdriveStatus === "completed" && (
						<div
							className={css({
								p: "4",
								borderRadius: "2xl",
								backgroundColor: "emerald.50",
								borderWidth: "1px",
								borderColor: "emerald.200",
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: "4",
								flexWrap: "wrap",
							})}
						>
							<div
								className={css({
									display: "flex",
									alignItems: "center",
									gap: "3",
								})}
							>
								<CheckCircle2
									className={css({
										w: "5",
										h: "5",
										color: "emerald.600",
										flexShrink: 0,
									})}
									aria-hidden="true"
								/>
								<div>
									<h3
										className={css({
											fontSize: "xs",
											fontWeight: "bold",
											color: "emerald.900",
										})}
									>
										{t("completedTitle")}
									</h3>
									<p className={css({ fontSize: "xs", color: "emerald.700" })}>
										{gdriveExportedAt
											? t("lastExport", {
													date: new Date(gdriveExportedAt).toLocaleString(
														"pl-PL",
													),
												})
											: t("completedDesc")}
									</p>
								</div>
							</div>

							{gdriveFolderId && (
								<a
									href={`https://drive.google.com/drive/folders/${gdriveFolderId}`}
									target="_blank"
									rel="noopener noreferrer"
									className={css({
										display: "inline-flex",
										alignItems: "center",
										gap: "1.5",
										px: "4",
										py: "2",
										borderRadius: "xl",
										fontSize: "xs",
										fontWeight: "bold",
										backgroundColor: "emerald.600",
										color: "white",
										boxShadow: "xs",
										textDecoration: "none",
										transition: "all 0.15s ease",
										_hover: { backgroundColor: "emerald.700" },
										_focusVisible: {
											outline: "2px solid",
											outlineColor: "emerald.500",
										},
									})}
								>
									<ArrowUpRight
										className={css({ w: "4", h: "4" })}
										aria-hidden="true"
									/>
									<span>{t("viewGDrive")}</span>
									<NewTabLabel />
								</a>
							)}
						</div>
					)}

					{gdriveStatus === "idle" && (
						<div
							className={css({
								fontSize: "xs",
								color: "slate.500",
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								flexWrap: "wrap",
								gap: "2",
							})}
						>
							<span>
								{t("idleDesc", { email: gdriveEmail || t("defaultAccount") })}
							</span>
							{gdriveExportedAt && (
								<span className={css({ fontSize: "11px", color: "slate.400" })}>
									{t("idleLastExport", {
										date: new Date(gdriveExportedAt).toLocaleString("pl-PL"),
									})}
								</span>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};
