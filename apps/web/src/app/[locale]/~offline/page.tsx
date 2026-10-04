import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { css, cx } from "styled-system/css";
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
		<div
			className={css({
				minH: "100vh",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				p: "6",
				textAlign: "center",
			})}
		>
			<WifiOff
				className={css({ w: "16", h: "16", color: "slate.300", mb: "6" })}
			/>
			<h1
				className={cx(
					"font-serif-luxury",
					css({
						fontSize: "3xl",
						fontWeight: "bold",
						color: "slate.900",
						mb: "4",
					}),
				)}
			>
				{t("heading")}
			</h1>
			<p className={css({ color: "slate.600", mb: "8", maxW: "md" })}>
				{t("description")}
			</p>
			<RefreshButton />
		</div>
	);
}
