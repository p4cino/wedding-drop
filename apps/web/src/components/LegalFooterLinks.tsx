import { useTranslations } from "next-intl";
import { css } from "styled-system/css";
import { Link } from "@/i18n/routing";

export function LegalFooterLinks() {
	const t = useTranslations("Common");
	return (
		<div
			className={css({
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				gap: "4",
			})}
		>
			<Link
				href="/polityka-prywatnosci"
				className={css({
					_hover: { color: "slate.800" },
					transition: "all 0.3s ease",
					_focusVisible: { outline: "2px solid", outlineColor: "amber.500" },
					borderRadius: "md",
					px: "1",
				})}
			>
				{t("privacyPolicy")}
			</Link>
			<span
				className={css({
					w: "1",
					h: "1",
					borderRadius: "full",
					backgroundColor: "slate.300",
				})}
				aria-hidden="true"
			/>
			<Link
				href="/regulamin"
				className={css({
					_hover: { color: "slate.800" },
					transition: "all 0.3s ease",
					_focusVisible: { outline: "2px solid", outlineColor: "amber.500" },
					borderRadius: "md",
					px: "1",
				})}
			>
				{t("termsOfService")}
			</Link>
		</div>
	);
}
