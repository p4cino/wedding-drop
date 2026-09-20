import { useTranslations } from "next-intl";
import React from "react";
import { Link } from "@/i18n/routing";

export function LegalFooterLinks() {
	const t = useTranslations("Common");
	return (
		<div className="flex justify-center items-center gap-4">
			<Link
				href="/polityka-prywatnosci"
				className="hover:text-slate-800 transition focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
			>
				{t("privacyPolicy")}
			</Link>
			<span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden="true" />
			<Link
				href="/regulamin"
				className="hover:text-slate-800 transition focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
			>
				{t("termsOfService")}
			</Link>
		</div>
	);
}
