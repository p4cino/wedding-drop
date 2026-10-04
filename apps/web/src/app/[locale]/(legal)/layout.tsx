import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { css } from "styled-system/css";
import { Link } from "@/i18n/routing";

export default function LegalLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const t = useTranslations("Common");
	return (
		<div
			className={css({
				minH: "100vh",
				backgroundColor: "#FAF8F5",
				display: "flex",
				flexDirection: "column",
			})}
		>
			<header
				className={css({
					maxW: "4xl",
					mx: "auto",
					w: "full",
					px: "6",
					py: "8",
				})}
			>
				<Link
					href="/"
					className={css({
						display: "inline-flex",
						alignItems: "center",
						gap: "2",
						fontSize: "sm",
						fontWeight: "semibold",
						color: "slate.600",
						_hover: { color: "slate.900" },
						transition: "all 0.3s ease",
						_focusVisible: { outline: "2px solid", outlineColor: "amber.500" },
						borderRadius: "lg",
						py: "1",
					})}
				>
					<ArrowLeft className={css({ w: "4", h: "4" })} aria-hidden="true" />
					{t("backToHome")}
				</Link>
			</header>

			<main
				className={css({
					maxW: "3xl",
					mx: "auto",
					w: "full",
					px: "6",
					py: "8",
					flex: 1,
				})}
			>
				{children}
			</main>

			<footer
				className={css({
					borderTopWidth: "1px",
					borderColor: "slate.200",
					py: "6",
					mt: "12",
					textAlign: "center",
					fontSize: "xs",
					color: "slate.500",
				})}
			>
				<p>{t("footerTagline")}</p>
			</footer>
		</div>
	);
}
