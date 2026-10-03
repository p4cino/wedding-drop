"use client";

import { Calendar, HardDrive, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { css } from "styled-system/css";
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
		<div
			className={css({
				display: "grid",
				gridTemplateColumns: { base: "repeat(1, 1fr)", sm: "repeat(3, 1fr)" },
				gap: "4",
			})}
		>
			{tiles.map(({ Icon, label, value }) => (
				<div
					key={label}
					className={css({
						backgroundColor: "white",
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
						<Icon
							className={css({ w: "4", h: "4", color: "wedding.gold" })}
							aria-hidden="true"
						/>
						<span>{label}</span>
					</div>
					<p
						className={css({
							fontSize: "3xl",
							fontWeight: "bold",
							color: "wedding.slate",
						})}
					>
						{value}
					</p>
				</div>
			))}
		</div>
	);
}
