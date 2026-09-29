"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
		<div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
			<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
				<h3 className="font-bold text-slate-800 text-sm">{t("tableTitle")}</h3>
				<span className="text-xs text-slate-500">
					{t("tableRecords", { count: galleries.length })}
				</span>
			</div>

			{/* `relative`: elementy sr-only (absolute) muszą mieć tu punkt odniesienia, inaczej poszerzają stronę na telefonie */}
			<div className="relative overflow-x-auto">
				<table className="w-full text-left text-xs" aria-label={t("tableAria")}>
					<thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
						<tr>
							{COLUMNS.map((key) => (
								<th key={key} scope="col" className="px-6 py-3">
									{t(key)}
								</th>
							))}
							<th scope="col" className="px-6 py-3 text-right">
								{t("thActions")}
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{galleries.map((g) => (
							<tr key={g.id} className="hover:bg-slate-50/80 transition">
								<td className="px-6 py-3.5 font-bold text-slate-900">
									{g.coupleNames}
								</td>
								<td className="px-6 py-3.5 text-slate-600">{g.weddingDate}</td>
								<td className="px-6 py-3.5 font-mono text-amber-700">
									{g.slug}
								</td>
								<td className="px-6 py-3.5 text-slate-600">{g.ownerEmail}</td>
								<td className="px-6 py-3.5 font-medium">{g.totalFiles}</td>
								<td className="px-6 py-3.5 font-medium text-slate-600">
									{formatMegabytes(Number(g.totalBytes || 0))} MB
								</td>
								<td className="px-6 py-3.5 text-right space-x-2">
									{GALLERY_LINKS.map((link) => (
										<Link
											key={link.path("")}
											href={link.path(g.slug)}
											target="_blank"
											title={t(link.tableLabelKey)}
											aria-label={`${t(link.tableLabelKey)} (${g.slug})`}
											className={`inline-block p-1.5 rounded-lg transition focus-visible:ring-2 focus-visible:outline-none ${link.tableTone}`}
										>
											{link.Icon ? (
												<link.Icon className="w-4 h-4" aria-hidden="true" />
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
										className="inline-block p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
									>
										<Trash2 className="w-4 h-4" aria-hidden="true" />
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
