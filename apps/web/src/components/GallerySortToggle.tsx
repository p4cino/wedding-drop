"use client";

import { useTranslations } from "next-intl";
import { css } from "styled-system/css";
import type { GallerySortOrder } from "@/lib/guest-likes";

interface GallerySortToggleProps {
	sortBy: GallerySortOrder;
	onChange: (sortBy: GallerySortOrder) => void;
}

const SORT_OPTIONS: readonly {
	value: GallerySortOrder;
	labelKey: "sortNewest" | "sortPopular";
}[] = [
	{ value: "newest", labelKey: "sortNewest" },
	{ value: "popular", labelKey: "sortPopular" },
];

export default function GallerySortToggle({
	sortBy,
	onChange,
}: GallerySortToggleProps) {
	const t = useTranslations("GuestGallery");

	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-end",
				gap: "2",
				mb: "4",
			})}
		>
			<span
				className={css({
					fontSize: "xs",
					fontWeight: "medium",
					color: "slate.500",
				})}
			>
				{t("sortLabel")}
			</span>
			<div
				className={css({
					display: "inline-flex",
					alignItems: "center",
					gap: "1",
					p: "1",
					bg: "white",
					borderRadius: "xl",
					borderWidth: "1px",
					borderColor: "slate.200",
					boxShadow: "xs",
				})}
			>
				{SORT_OPTIONS.map((opt) => {
					const active = sortBy === opt.value;
					return (
						<button
							key={opt.value}
							type="button"
							aria-pressed={active}
							onClick={() => onChange(opt.value)}
							className={css({
								px: "3",
								py: "1.5",
								borderRadius: "lg",
								fontSize: "xs",
								fontWeight: "semibold",
								cursor: "pointer",
								borderWidth: "0",
								transition: "all 0.15s ease",
								backgroundColor: active ? "slate.900" : "transparent",
								color: active ? "white" : "slate.600",
								_hover: {
									backgroundColor: active ? "slate.900" : "slate.100",
								},
								_focusVisible: {
									outline: "2px solid",
									outlineColor: "wedding.gold",
								},
							})}
						>
							{t(opt.labelKey)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
