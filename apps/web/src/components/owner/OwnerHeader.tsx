"use client";

import { Download, ExternalLink, LogOut, QrCode, Tv } from "lucide-react";
import { useTranslations } from "next-intl";
import NewTabLabel from "@/components/NewTabLabel";
import { Link } from "@/i18n/routing";

interface OwnerHeaderProps {
	slug: string;
	ownerToken: string;
	coupleNames?: string;
	onLogout?: () => void;
}

const SOFT_LINK =
	"inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none";

export function OwnerHeader({
	slug,
	ownerToken: _ownerToken,
	coupleNames,
	onLogout,
}: OwnerHeaderProps) {
	const t = useTranslations("OwnerPanel");
	const newTab = <NewTabLabel />;

	return (
		<header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4">
			<div>
				<h1 className="font-serif-luxury text-xl sm:text-2xl font-bold text-slate-900">
					{coupleNames || t("defaultOwnerTitle")}
				</h1>
				<p className="text-xs text-slate-500">{t("ownerSubtitle")}</p>
			</div>

			<div className="flex items-center gap-2.5">
				<Link href={`/g/${slug}`} target="_blank" className={SOFT_LINK}>
					<ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
					<span>{t("viewGallery")}</span>
					{newTab}
				</Link>

				<Link
					href={`/g/${slug}/card`}
					className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
				>
					<QrCode className="w-3.5 h-3.5" aria-hidden="true" />
					<span>{t("cardBtn")}</span>
				</Link>

				<Link href={`/g/${slug}/tv`} target="_blank" className={SOFT_LINK}>
					<Tv className="w-3.5 h-3.5" aria-hidden="true" />
					<span>{t("openTvBtn")}</span>
					{newTab}
				</Link>

				<a
					href={`/api/gallery/${slug}/zip`}
					className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
				>
					<Download className="w-4 h-4" aria-hidden="true" />
					<span>{t("downloadZip")}</span>
				</a>

				{onLogout && (
					<button
						type="button"
						onClick={onLogout}
						className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 transition focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
					>
						<LogOut className="w-3.5 h-3.5" aria-hidden="true" />
						<span>{t("logoutBtn")}</span>
					</button>
				)}
			</div>
		</header>
	);
}
