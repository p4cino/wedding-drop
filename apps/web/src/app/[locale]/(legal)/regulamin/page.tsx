import { useTranslations } from "next-intl";
import { css, cx } from "styled-system/css";
import { AdminPlaceholderAlert } from "@/components/AdminPlaceholderAlert";

export default function TermsOfServicePage() {
	const t = useTranslations("Legal");
	return (
		<>
			<h1
				className={cx(
					"font-serif-luxury",
					css({
						fontSize: { base: "3xl", sm: "4xl" },
						fontWeight: "bold",
						color: "slate.900",
						mb: "8",
					}),
				)}
			>
				{t("termsTitle")}
			</h1>

			<div
				className={css({
					color: "slate.600",
					backgroundColor: "white",
					p: { base: "8", sm: "10" },
					borderRadius: "3xl",
					boxShadow: "sm",
					borderWidth: "1px",
					borderColor: "slate.200",
					lineHeight: "relaxed",
					fontSize: { base: "sm", sm: "base" },
				})}
			>
				<p
					className={css({ fontStyle: "italic", mb: "8", color: "slate.500" })}
				>
					{t("lastUpdate")}
				</p>

				<h2
					className={css({
						fontSize: { base: "lg", sm: "xl" },
						fontWeight: "semibold",
						color: "slate.800",
						mt: "8",
						mb: "3",
					})}
				>
					{t("t1Title")}
				</h2>
				<p className={css({ mb: "6" })}>{t("t1Text")}</p>

				<h2
					className={css({
						fontSize: { base: "lg", sm: "xl" },
						fontWeight: "semibold",
						color: "slate.800",
						mt: "8",
						mb: "3",
					})}
				>
					{t("t2Title")}
				</h2>
				<p className={css({ mb: "6" })}>{t("t2Text")}</p>

				<h2
					className={css({
						fontSize: { base: "lg", sm: "xl" },
						fontWeight: "semibold",
						color: "slate.800",
						mt: "8",
						mb: "3",
					})}
				>
					{t("t3Title")}
				</h2>
				<p className={css({ mb: "6" })}>{t("t3Text")}</p>

				<h2
					className={css({
						fontSize: { base: "lg", sm: "xl" },
						fontWeight: "semibold",
						color: "slate.800",
						mt: "8",
						mb: "3",
					})}
				>
					{t("t4Title")}
				</h2>
				<p className={css({ mb: "6" })}>{t("t4Text")}</p>

				<h2
					className={css({
						fontSize: { base: "lg", sm: "xl" },
						fontWeight: "semibold",
						color: "slate.800",
						mt: "8",
						mb: "3",
					})}
				>
					{t("t5Title")}
				</h2>
				<p className={css({ mb: "6" })}>{t("t5Text")}</p>

				<AdminPlaceholderAlert type="terms" />
			</div>
		</>
	);
}
