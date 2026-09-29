"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

interface GalleryStatusScreenProps {
	variant: "loading" | "notFound" | "error";
	/** Ciemne tło (widok TV) zamiast jasnego. */
	dark?: boolean;
	onRetry?: () => void;
}

const BUTTON_CLASS =
	"inline-block px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none";

export default function GalleryStatusScreen({
	variant,
	dark = false,
	onRetry,
}: GalleryStatusScreenProps) {
	const t = useTranslations("GuestGallery");
	const tCommon = useTranslations("Common");
	const background = dark ? "bg-black" : "bg-[#FAF8F5]";

	if (variant === "loading") {
		return (
			<div
				className={`min-h-screen flex items-center justify-center ${background}`}
			>
				<div className="text-center space-y-3">
					<Heart className="w-10 h-10 text-amber-500 animate-pulse mx-auto" />
					<p
						className={`font-serif-luxury text-lg ${dark ? "text-white" : "text-slate-700"}`}
					>
						{tCommon("loading")}
					</p>
				</div>
			</div>
		);
	}

	const isError = variant === "error";
	return (
		<div
			className={`min-h-screen flex items-center justify-center ${background} p-6 text-center`}
		>
			<div className="max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
				<h2 className="font-serif-luxury text-2xl font-bold text-slate-900 mb-2">
					{isError ? tCommon("loadError") : t("notFoundTitle")}
				</h2>
				<p className="text-sm text-slate-500 mb-6">
					{isError ? tCommon("loadErrorDesc") : t("notFoundDesc")}
				</p>
				{isError && onRetry ? (
					<button type="button" onClick={onRetry} className={BUTTON_CLASS}>
						{tCommon("retryBtn")}
					</button>
				) : (
					<Link href="/" className={BUTTON_CLASS}>
						{t("homeBtn")}
					</Link>
				)}
			</div>
		</div>
	);
}
