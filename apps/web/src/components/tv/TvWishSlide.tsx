"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { css } from "styled-system/css";
import type { WishItemData } from "@/lib/gallery-types";

interface TvWishSlideProps {
	wish: WishItemData;
}

/**
 * Pełnoekranowa karta typograficzna z wpisem z Księgi Życzeń wyświetlana w Trybie TV.
 */
export default function TvWishSlide({ wish }: TvWishSlideProps) {
	const t = useTranslations("TvSlideshow");

	return (
		<div
			data-testid="tv-wish-slide"
			className={css({
				position: "absolute",
				inset: "0",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				px: { base: "6", md: "20" },
				py: "24",
				background:
					"radial-gradient(circle at center, rgba(30, 41, 59, 0.92) 0%, rgba(2, 6, 23, 0.98) 100%)",
			})}
		>
			<div
				className={css({
					maxW: "4xl",
					w: "full",
					textAlign: "center",
					px: { base: "8", md: "14" },
					py: { base: "10", md: "14" },
					borderRadius: "3xl",
					border: "1px solid rgba(212, 175, 55, 0.45)",
					backgroundColor: "rgba(15, 23, 42, 0.75)",
					backdropFilter: "blur(12px)",
					boxShadow: "2xl",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "6",
				})}
			>
				<span
					data-testid="tv-wish-badge"
					className={css({
						display: "inline-flex",
						alignItems: "center",
						gap: "2",
						px: "4",
						py: "1.5",
						borderRadius: "full",
						backgroundColor: "rgba(212, 175, 55, 0.18)",
						border: "1px solid rgba(212, 175, 55, 0.5)",
						color: "wedding.gold",
						fontSize: "xs",
						fontWeight: "semibold",
						letterSpacing: "wider",
						textTransform: "uppercase",
					})}
				>
					<Heart
						aria-hidden="true"
						className={css({
							w: "3.5",
							h: "3.5",
							color: "wedding.gold",
						})}
					/>
					<span>{t("wishBadge")}</span>
				</span>

				<blockquote
					data-testid="tv-wish-message"
					className={css({
						fontFamily: "serif",
						fontSize: { base: "2xl", md: "4xl" },
						lineHeight: "relaxed",
						color: "white",
						fontStyle: "italic",
						wordBreak: "break-word",
					})}
				>
					{wish.message}
				</blockquote>

				<p
					data-testid="tv-wish-author"
					className={css({
						fontSize: { base: "base", md: "lg" },
						fontWeight: "medium",
						color: "wedding.gold",
					})}
				>
					<span aria-hidden="true">— </span>
					<span>{wish.guestName?.trim() || t("wishAuthorFallback")}</span>
				</p>
			</div>
		</div>
	);
}
