"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { css } from "styled-system/css";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

interface GalleryStatusScreenProps {
	variant: "loading" | "notFound" | "error";
	/** Ciemne tło (widok TV) zamiast jasnego. */
	dark?: boolean;
	onRetry?: () => void;
}

const buttonStyle = css({
	display: "inline-block",
	px: "6",
	py: "2.5",
	backgroundColor: "slate.900",
	color: "white",
	borderRadius: "xl",
	fontSize: "sm",
	fontWeight: "semibold",
	textDecoration: "none",
	transition: "background-color 0.15s ease",
	cursor: "pointer",
	_hover: { backgroundColor: "slate.800" },
	_focusVisible: { outline: "2px solid", outlineColor: "slate.900" },
});

export default function GalleryStatusScreen({
	variant,
	dark = false,
	onRetry,
}: GalleryStatusScreenProps) {
	const t = useTranslations("GuestGallery");
	const tCommon = useTranslations("Common");
	const background = dark ? "black" : "#FAF8F5";

	if (variant === "loading") {
		return (
			<div
				className={css({
					minH: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				})}
				style={{ backgroundColor: background }}
			>
				<div
					className={css({
						textAlign: "center",
						display: "flex",
						flexDirection: "column",
						gap: "3",
					})}
				>
					<Heart
						className={css({
							w: "10",
							h: "10",
							color: "wedding.gold",
							animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
							mx: "auto",
						})}
					/>
					<p
						className={css({
							fontFamily: "serif",
							fontSize: "lg",
							color: dark ? "white" : "slate.700",
						})}
					>
						{tCommon("loading")}
					</p>
				</div>
			</div>
		);
	}

	const isError = variant === "error";
	return (
		<div
			className={css({
				minH: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				p: "6",
				textAlign: "center",
			})}
			style={{ backgroundColor: background }}
		>
			<div
				className={css({
					maxW: "md",
					backgroundColor: "white",
					p: "8",
					borderRadius: "3xl",
					boxShadow: "sm",
					borderWidth: "1px",
					borderColor: "slate.200",
				})}
			>
				<h2
					className={css({
						fontFamily: "serif",
						fontSize: "2xl",
						fontWeight: "bold",
						color: "wedding.slate",
						mb: "2",
					})}
				>
					{isError ? tCommon("loadError") : t("notFoundTitle")}
				</h2>
				<p
					className={css({
						fontSize: "sm",
						color: "slate.500",
						mb: "6",
					})}
				>
					{isError ? tCommon("loadErrorDesc") : t("notFoundDesc")}
				</p>
				{isError && onRetry ? (
					<Button type="button" onClick={onRetry} className={buttonStyle}>
						{tCommon("retryBtn")}
					</Button>
				) : (
					<Link href="/" className={buttonStyle}>
						{t("homeBtn")}
					</Link>
				)}
			</div>
		</div>
	);
}
