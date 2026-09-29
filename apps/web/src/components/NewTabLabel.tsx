"use client";

import { useTranslations } from "next-intl";

/** Tekst dla czytników ekranu przy linkach otwieranych w nowej karcie. */
export default function NewTabLabel() {
	const t = useTranslations("Common");
	return <span className="sr-only">{t("opensInNewTab")}</span>;
}
