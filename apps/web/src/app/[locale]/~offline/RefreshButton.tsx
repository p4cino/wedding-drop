"use client";

import { useTranslations } from "next-intl";

export function RefreshButton() {
	const t = useTranslations("Offline");
	return (
		<button
			type="button"
			onClick={() => window.location.reload()}
			className="px-6 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition shadow-md"
		>
			{t("refreshBtn")}
		</button>
	);
}
