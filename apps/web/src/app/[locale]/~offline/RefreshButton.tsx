"use client";

import { useTranslations } from "next-intl";
import { css } from "styled-system/css";

export function RefreshButton() {
	const t = useTranslations("Offline");
	return (
		<button
			type="button"
			onClick={() => window.location.reload()}
			className={css({
				px: "6",
				py: "3",
				backgroundColor: "slate.900",
				color: "white",
				borderRadius: "full",
				fontWeight: "medium",
				_hover: { backgroundColor: "slate.800" },
				transition: "all 0.3s ease",
				boxShadow: "md",
				cursor: "pointer",
			})}
		>
			{t("refreshBtn")}
		</button>
	);
}
