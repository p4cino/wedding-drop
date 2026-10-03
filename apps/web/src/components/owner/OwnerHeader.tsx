"use client";

import { Download, ExternalLink, LogOut, QrCode, Tv } from "lucide-react";
import { useTranslations } from "next-intl";
import { css } from "styled-system/css";
import NewTabLabel from "@/components/NewTabLabel";
import { Link } from "@/i18n/routing";

interface OwnerHeaderProps {
	slug: string;
	ownerToken: string;
	coupleNames?: string;
	onLogout?: () => void;
}

const softLinkStyle = css({
	display: "inline-flex",
	alignItems: "center",
	gap: "1.5",
	px: "3",
	py: "2",
	fontSize: "xs",
	fontWeight: "semibold",
	borderRadius: "xl",
	backgroundColor: "slate.100",
	color: "slate.700",
	textDecoration: "none",
	transition: "all 0.15s ease",
	_hover: { backgroundColor: "slate.200" },
	_focusVisible: { outline: "2px solid", outlineColor: "slate.900" },
});

export function OwnerHeader({
	slug,
	ownerToken: _ownerToken,
	coupleNames,
	onLogout,
}: OwnerHeaderProps) {
	const t = useTranslations("OwnerPanel");
	const newTab = <NewTabLabel />;

	return (
		<header
			className={css({
				backgroundColor: "white",
				borderBottomWidth: "1px",
				borderBottomColor: "slate.200",
				px: { base: "4", sm: "8" },
				py: "4",
				position: "sticky",
				top: "0",
				zIndex: "30",
				display: "flex",
				flexWrap: "wrap",
				alignItems: "center",
				justifyContent: "space-between",
				gap: "4",
			})}
		>
			<div>
				<h1
					className={css({
						fontFamily: "serif",
						fontSize: { base: "xl", sm: "2xl" },
						fontWeight: "bold",
						color: "wedding.slate",
					})}
				>
					{coupleNames || t("defaultOwnerTitle")}
				</h1>
				<p className={css({ fontSize: "xs", color: "slate.500" })}>
					{t("ownerSubtitle")}
				</p>
			</div>

			<div
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "2.5",
				})}
			>
				<Link href={`/g/${slug}`} target="_blank" className={softLinkStyle}>
					<ExternalLink
						className={css({ w: "3.5", h: "3.5" })}
						aria-hidden="true"
					/>
					<span>{t("viewGallery")}</span>
					{newTab}
				</Link>

				<Link
					href={`/g/${slug}/card`}
					className={css({
						display: "inline-flex",
						alignItems: "center",
						gap: "1.5",
						px: "3",
						py: "2",
						fontSize: "xs",
						fontWeight: "semibold",
						borderRadius: "xl",
						backgroundColor: "amber.50",
						color: "amber.800",
						borderWidth: "1px",
						borderColor: "amber.200",
						textDecoration: "none",
						transition: "all 0.15s ease",
						_hover: { backgroundColor: "amber.100" },
						_focusVisible: {
							outline: "2px solid",
							outlineColor: "wedding.gold",
						},
					})}
				>
					<QrCode className={css({ w: "3.5", h: "3.5" })} aria-hidden="true" />
					<span>{t("cardBtn")}</span>
				</Link>

				<Link href={`/g/${slug}/tv`} target="_blank" className={softLinkStyle}>
					<Tv className={css({ w: "3.5", h: "3.5" })} aria-hidden="true" />
					<span>{t("openTvBtn")}</span>
					{newTab}
				</Link>

				<a
					href={`/api/gallery/${slug}/zip`}
					className={css({
						display: "inline-flex",
						alignItems: "center",
						gap: "1.5",
						px: "4",
						py: "2",
						fontSize: "xs",
						fontWeight: "semibold",
						borderRadius: "xl",
						backgroundColor: "slate.800",
						color: "white",
						boxShadow: "sm",
						textDecoration: "none",
						transition: "all 0.15s ease",
						_hover: { backgroundColor: "slate.900" },
						_focusVisible: { outline: "2px solid", outlineColor: "slate.900" },
					})}
				>
					<Download className={css({ w: "4", h: "4" })} aria-hidden="true" />
					<span>{t("downloadZip")}</span>
				</a>

				{onLogout && (
					<button
						type="button"
						onClick={onLogout}
						className={css({
							display: "inline-flex",
							alignItems: "center",
							gap: "1.5",
							px: "3",
							py: "2",
							fontSize: "xs",
							fontWeight: "semibold",
							borderRadius: "xl",
							backgroundColor: "slate.100",
							color: "slate.700",
							borderWidth: "0",
							cursor: "pointer",
							transition: "all 0.15s ease",
							_hover: {
								backgroundColor: "red.50",
								color: "red.700",
							},
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "slate.900",
							},
						})}
					>
						<LogOut
							className={css({ w: "3.5", h: "3.5" })}
							aria-hidden="true"
						/>
						<span>{t("logoutBtn")}</span>
					</button>
				)}
			</div>
		</header>
	);
}
