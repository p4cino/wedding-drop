"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { css, cx } from "styled-system/css";
import NewTabLabel from "@/components/NewTabLabel";
import { Link } from "@/i18n/routing";
import type { GalleryRow } from "@/lib/admin-types";
import { formatMegabytes } from "@/lib/format";
import { GALLERY_LINKS } from "./galleryLinks";

const COLUMNS = [
	"thCouple",
	"thDate",
	"thSlug",
	"thEmail",
	"thFiles",
	"thSize",
] as const;

interface GalleryTableProps {
	galleries: GalleryRow[];
	onDelete: (gallery: GalleryRow) => void;
}

export function GalleryTable({ galleries, onDelete }: GalleryTableProps) {
	const t = useTranslations("AdminPanel");
	return (
		<div
			className={css({
				backgroundColor: "white",
				borderRadius: "2xl",
				borderWidth: "1px",
				borderColor: "slate.200",
				boxShadow: "xs",
				overflow: "hidden",
			})}
		>
			<div
				className={css({
					px: "6",
					py: "4",
					borderBottomWidth: "1px",
					borderBottomColor: "slate.100",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				})}
			>
				<h3
					className={css({
						fontWeight: "bold",
						color: "wedding.slate",
						fontSize: "sm",
					})}
				>
					{t("tableTitle")}
				</h3>
				<span className={css({ fontSize: "xs", color: "slate.500" })}>
					{t("tableRecords", { count: galleries.length })}
				</span>
			</div>

			{/* `relative`: elementy sr-only (absolute) muszą mieć tu punkt odniesienia */}
			<div
				className={css({
					position: "relative",
					overflowX: "auto",
				})}
			>
				<table
					className={css({
						w: "full",
						textAlign: "left",
						fontSize: "xs",
					})}
					aria-label={t("tableAria")}
				>
					<thead
						className={css({
							backgroundColor: "slate.50",
							color: "slate.600",
							fontWeight: "semibold",
							borderBottomWidth: "1px",
							borderBottomColor: "slate.100",
						})}
					>
						<tr>
							{COLUMNS.map((key) => (
								<th key={key} scope="col" className={css({ px: "6", py: "3" })}>
									{t(key)}
								</th>
							))}
							<th
								scope="col"
								className={css({ px: "6", py: "3", textAlign: "right" })}
							>
								{t("thActions")}
							</th>
						</tr>
					</thead>
					<tbody
						className={css({
							"& tr:not(:last-child)": {
								borderBottomWidth: "1px",
								borderBottomColor: "slate.100",
							},
						})}
					>
						{galleries.map((g) => (
							<tr
								key={g.id}
								className={css({
									transition: "background-color 0.15s ease",
									_hover: { backgroundColor: "slate.50" },
								})}
							>
								<td
									className={css({
										px: "6",
										py: "3.5",
										fontWeight: "bold",
										color: "wedding.slate",
									})}
								>
									{g.coupleNames}
								</td>
								<td className={css({ px: "6", py: "3.5", color: "slate.600" })}>
									{g.weddingDate}
								</td>
								<td
									className={css({
										px: "6",
										py: "3.5",
										fontFamily: "mono",
										color: "wedding.gold",
									})}
								>
									{g.slug}
								</td>
								<td className={css({ px: "6", py: "3.5", color: "slate.600" })}>
									{g.ownerEmail}
								</td>
								<td
									className={css({ px: "6", py: "3.5", fontWeight: "medium" })}
								>
									{g.totalFiles}
								</td>
								<td
									className={css({
										px: "6",
										py: "3.5",
										fontWeight: "medium",
										color: "slate.600",
									})}
								>
									{formatMegabytes(Number(g.totalBytes || 0))} MB
								</td>
								<td
									className={css({
										px: "6",
										py: "3.5",
										textAlign: "right",
										display: "flex",
										alignItems: "center",
										justifyContent: "flex-end",
										gap: "2",
									})}
								>
									{GALLERY_LINKS.map((link) => (
										<Link
											key={link.path("")}
											href={link.path(g.slug)}
											target="_blank"
											title={t(link.tableLabelKey)}
											className={cx(
												css({
													display: "inline-block",
													p: "1.5",
													borderRadius: "lg",
													transition: "all 0.15s ease",
													_focusVisible: { outline: "none" },
												}),
												link.tableTone,
											)}
										>
											{link.Icon ? (
												<link.Icon
													className={css({ w: "4", h: "4" })}
													aria-hidden="true"
												/>
											) : (
												t("ownerPanelLink")
											)}
											<NewTabLabel />
										</Link>
									))}
									<button
										type="button"
										onClick={() => onDelete(g)}
										title={t("actionDelete")}
										aria-label={`${t("actionDelete")} (${g.slug})`}
										className={css({
											display: "inline-block",
											p: "1.5",
											borderRadius: "lg",
											color: "slate.600",
											borderWidth: "0",
											backgroundColor: "transparent",
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
										<Trash2
											className={css({ w: "4", h: "4" })}
											aria-hidden="true"
										/>
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
