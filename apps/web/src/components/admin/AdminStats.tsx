"use client";

import { Calendar, HardDrive, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { GalleryRow } from "@/lib/admin-types";
import { formatMegabytes } from "@/lib/format";

export function AdminStats({ galleries }: { galleries: GalleryRow[] }) {
	const t = useTranslations("AdminPanel");
	const totalFiles = galleries.reduce((acc, g) => acc + (g.totalFiles || 0), 0);
	const totalBytes = galleries.reduce(
		(acc, g) => acc + Number(g.totalBytes || 0),
		0,
	);
	const totalMb = formatMegabytes(totalBytes);

	const tiles = [
		{ Icon: Users, label: t("statsWeddings"), value: galleries.length },
		{ Icon: Calendar, label: t("statsFiles"), value: totalFiles },
		{ Icon: HardDrive, label: t("statsDisk"), value: `${totalMb} MB` },
	];

	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
			{tiles.map(({ Icon, label, value }) => (
				<div
					key={label}
					className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs"
				>
					<div className="flex items-center gap-2 text-slate-600 text-xs font-medium mb-1">
						<Icon className="w-4 h-4 text-amber-600" aria-hidden="true" />
						<span>{label}</span>
					</div>
					<p className="text-3xl font-bold text-slate-900">{value}</p>
				</div>
			))}
		</div>
	);
}
