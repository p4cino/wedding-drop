"use client";

import { Film, HardDrive, Images, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { css } from "styled-system/css";
import { Badge } from "@/components/ui/badge";
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
		<div
			className={css({
				bg: "white",
				p: "5",
				borderRadius: "2xl",
				borderWidth: "1px",
				borderColor: "slate.200",
				boxShadow: "xs",
			})}
		>
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "2",
					color: "slate.600",
					fontSize: "xs",
					fontWeight: "medium",
					mb: "1",
				})}
			>
				{icon}
				<span>{label}</span>
			</div>
			<p
				className={css({
					fontSize: "2xl",
					fontWeight: "bold",
					color: "wedding.slate",
				})}
			>
				{value}
			</p>
		</div>
	);
}

const iconClass = css({ w: "4", h: "4", color: "wedding.gold" });

export const OwnerStatsGrid: React.FC<OwnerStatsGridProps> = ({
	imagesCount,
	videosCount,
	totalBytes,
	onRefresh,
}) => {
	const t = useTranslations("OwnerPanel");
	return (
		<div
			className={css({
				display: "grid",
				gridTemplateColumns: { base: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
				gap: "4",
			})}
		>
			<StatTile
				icon={<Images className={iconClass} aria-hidden="true" />}
				label={t("photos")}
				value={imagesCount}
			/>
			<StatTile
				icon={<Film className={iconClass} aria-hidden="true" />}
				label={t("videos")}
				value={videosCount}
			/>
			<StatTile
				icon={<HardDrive className={iconClass} aria-hidden="true" />}
				label={t("storage")}
				value={t("storageUnit", { size: formatMegabytes(totalBytes) })}
			/>

			<div
				className={css({
					bg: "white",
					p: "5",
					borderRadius: "2xl",
					borderWidth: "1px",
					borderColor: "slate.200",
					boxShadow: "xs",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				})}
			>
				<div>
					<div
						className={css({
							color: "slate.600",
							fontSize: "xs",
							fontWeight: "medium",
							mb: "1",
						})}
					>
						{t("galleryStatus")}
					</div>
					<Badge
						size="sm"
						className={css({
							display: "inline-flex",
							alignItems: "center",
							gap: "1",
							px: "2",
							py: "0.5",
							borderRadius: "full",
							fontSize: "xs",
							fontWeight: "semibold",
							bg: "emerald.100",
							color: "emerald.800",
						})}
					>
						{t("statusActive")}
					</Badge>
				</div>
				<button
					type="button"
					onClick={onRefresh}
					title={t("refreshBtn")}
					aria-label={t("refreshAria")}
					className={css({
						p: "2",
						borderRadius: "lg",
						color: "slate.600",
						borderWidth: "0",
						cursor: "pointer",
						transition: "all 0.15s ease",
						_hover: {
							bg: "slate.100",
							color: "slate.900",
						},
						_focusVisible: {
							outline: "2px solid",
							outlineColor: "wedding.gold",
						},
					})}
				>
					<RefreshCw className={css({ w: "4", h: "4" })} aria-hidden="true" />
				</button>
			</div>
		</div>
	);
};
