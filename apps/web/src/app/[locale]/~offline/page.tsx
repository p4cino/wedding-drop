import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RefreshButton } from "./RefreshButton";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Offline" });
	return { title: t("title") };
}

export default async function OfflineFallbackPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Offline" });
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
			<WifiOff className="w-16 h-16 text-slate-300 mb-6" />
			<h1 className="font-serif-luxury text-3xl font-bold text-slate-900 mb-4">
				{t("heading")}
			</h1>
			<p className="text-slate-600 mb-8 max-w-md">{t("description")}</p>
			<RefreshButton />
		</div>
	);
}
