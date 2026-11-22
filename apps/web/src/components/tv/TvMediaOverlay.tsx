"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { css } from "styled-system/css";
import type { MediaItemData } from "@/lib/gallery-types";

interface TvMediaOverlayProps {
	media: MediaItemData;
	questTitle: string | null;
}

/**
 * Dolna karta metadanych zdjęcia w Trybie TV: odznaka wyzwania, licznik serduszek,
 * krótki podpis kontekstowy (`caption`) oraz autor.
 */
export default function TvMediaOverlay({
	media,
	questTitle,
}: TvMediaOverlayProps) {
	const t = useTranslations("TvSlideshow");
	const likesCount = media.likesCount ?? 0;

	if (!media.uploaderName && !media.caption && !questTitle && likesCount <= 0) {
		return null;
	}

	return (
		<div
			data-testid="tv-media-overlay"
			className={css({
				position: "absolute",
				bottom: "8",
				left: "8",
				px: "5",
				py: "3",
				borderRadius: "2xl",
				backgroundColor: "rgba(0, 0, 0, 0.55)",
				backdropFilter: "blur(8px)",
				color: "white",
				maxW: "60%",
				display: "flex",
				flexDirection: "column",
				gap: "1.5",
			})}
		>
			{(questTitle || likesCount > 0) && (
				<div
					className={css({
						display: "flex",
						flexWrap: "wrap",
						alignItems: "center",
						gap: "2",
					})}
				>
					{questTitle && (
						<span
							data-testid="tv-quest-badge"
							className={css({
								display: "inline-flex",
								alignItems: "center",
								gap: "1",
								px: "2.5",
								py: "0.5",
								borderRadius: "full",
								backgroundColor: "rgba(212, 175, 55, 0.25)",
								border: "1px solid rgba(212, 175, 55, 0.5)",
								color: "wedding.gold",
								fontSize: "xs",
								fontWeight: "semibold",
							})}
						>
							<span aria-hidden="true">🎯 </span>
							<span>{questTitle}</span>
						</span>
					)}
					{likesCount > 0 && (
						<span
							data-testid="tv-likes-badge"
							className={css({
								display: "inline-flex",
								alignItems: "center",
								gap: "1",
								px: "2.5",
								py: "0.5",
								borderRadius: "full",
								backgroundColor: "rgba(244, 63, 94, 0.25)",
								border: "1px solid rgba(244, 63, 94, 0.5)",
								color: "white",
								fontSize: "xs",
								fontWeight: "semibold",
							})}
						>
							<Heart
								aria-hidden="true"
								className={css({
									w: "3.5",
									h: "3.5",
									color: "rose.400",
									fill: "currentColor",
								})}
							/>
							<span>{likesCount}</span>
						</span>
					)}
				</div>
			)}

			{media.caption && (
				<p
					data-testid="tv-media-caption"
					className={css({
						fontFamily: "serif",
						fontStyle: "italic",
						fontSize: { base: "base", md: "lg" },
						color: "white",
						lineClamp: 2,
						overflow: "hidden",
					})}
				>
					{media.caption}
				</p>
			)}

			{media.uploaderName && (
				<div
					className={css({
						fontSize: "sm",
						color: "slate.200",
					})}
				>
					{t("uploaderPrefix")} {media.uploaderName}
				</div>
			)}
		</div>
	);
}
