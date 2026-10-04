import { useTranslations } from "next-intl";
import { css, cx } from "styled-system/css";
import { AdminPlaceholderAlert } from "@/components/AdminPlaceholderAlert";

export default function PrivacyPolicyPage() {
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
				{t("privacyTitle")}
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
					{t("p1Title")}
				</h2>
				<p className={css({ mb: "6" })}>{t("p1Text")}</p>

				<h2
					className={css({
						fontSize: { base: "lg", sm: "xl" },
						fontWeight: "semibold",
						color: "slate.800",
						mt: "8",
						mb: "3",
					})}
				>
					{t("p2Title")}
				</h2>
				<p className={css({ mb: "6" })}>{t("p2Text")}</p>

				<h2
					className={css({
						fontSize: { base: "lg", sm: "xl" },
						fontWeight: "semibold",
						color: "slate.800",
						mt: "8",
						mb: "3",
					})}
				>
					{t("p3Title")}
				</h2>
				<p className={css({ mb: "6" })}>{t("p3Text")}</p>

				<h2
					className={css({
						fontSize: { base: "lg", sm: "xl" },
						fontWeight: "semibold",
						color: "slate.800",
						mt: "8",
						mb: "3",
					})}
				>
					{t("p4Title")}
				</h2>
				<p className={css({ mb: "6" })}>{t("p4Text")}</p>

				<h2
					className={css({
						fontSize: { base: "lg", sm: "xl" },
						fontWeight: "semibold",
						color: "slate.800",
						mt: "8",
						mb: "3",
					})}
				>
					{t("p5Title")}
				</h2>
				<p className={css({ mb: "6" })}>{t("p5Text")}</p>

				<AdminPlaceholderAlert type="privacy" />
			</div>
		</>
	);
}
