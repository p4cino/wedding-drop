import { useTranslations } from "next-intl";
import { css } from "styled-system/css";

interface AdminPlaceholderAlertProps {
	type: "privacy" | "terms";
}

export function AdminPlaceholderAlert({ type }: AdminPlaceholderAlertProps) {
	const t = useTranslations("AdminPanel");
	const description =
		type === "privacy" ? t("privacyPlaceholder") : t("termsPlaceholder");

	return (
		<div
			className={css({
				mt: "12",
				p: "4",
				backgroundColor: "amber.50",
				borderRadius: "xl",
				borderWidth: "1px",
				borderColor: "amber.200",
				color: "amber.800",
				fontSize: "sm",
			})}
		>
			<p className={css({ fontWeight: "semibold", mb: "1" })}>
				{t("placeholderTitle")}
			</p>
			<p>{description}</p>
		</div>
	);
}
