import { useTranslations } from "next-intl";

interface AdminPlaceholderAlertProps {
	type: "privacy" | "terms";
}

export function AdminPlaceholderAlert({ type }: AdminPlaceholderAlertProps) {
	const t = useTranslations("AdminPanel");
	const description =
		type === "privacy" ? t("privacyPlaceholder") : t("termsPlaceholder");

	return (
		<div className="mt-12 p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm">
			<p className="font-semibold mb-1">{t("placeholderTitle")}</p>
			<p>{description}</p>
		</div>
	);
}
