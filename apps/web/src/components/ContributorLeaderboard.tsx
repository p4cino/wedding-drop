"use client";

import { Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { css } from "styled-system/css";
import { Badge } from "@/components/ui/badge";
import type { MediaItemData } from "@/lib/gallery-types";
import { computeLeaderboard } from "@/lib/leaderboard";

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

interface ContributorLeaderboardProps {
	items: MediaItemData[];
}

/**
 * Niewielki widget "Najaktywniejsi goście" — pokazuje TOP 3 podpisy gości
 * z liczbą wgranych materiałów i odznaką miejsca (🥇🥈🥉).
 *
 * Czysto prezentacyjny: przyjmuje `items` (te same materiały, które galeria
 * gościa już wczytała i utrzymuje na żywo przez SSE) i sam przelicza ranking
 * przez `useMemo`, więc odświeża się automatycznie po każdej zmianie `items`
 * — bez własnego stanu ładowania/błędu i bez żadnego I/O.
 */
export default function ContributorLeaderboard({
	items,
}: ContributorLeaderboardProps) {
	const t = useTranslations("GuestGallery");
	const leaderboard = useMemo(() => computeLeaderboard(items), [items]);

	if (leaderboard.length === 0) {
		return null;
	}

	return (
		<section
			aria-label={t("leaderboardTitle")}
			className={css({
				maxW: "6xl",
				mx: "auto",
				px: { base: "4", sm: "6" },
				mb: "5",
			})}
		>
			<div
				className={css({
					bg: "rgba(255, 255, 255, 0.8)",
					backdropFilter: "blur(4px)",
					borderRadius: "2xl",
					borderWidth: "1px",
					borderColor: "amber.100",
					boxShadow: "xs",
					px: { base: "4", sm: "5" },
					py: { base: "3", sm: "4" },
				})}
			>
				<h2
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "1.5",
						fontSize: "xs",
						fontWeight: "semibold",
						textTransform: "uppercase",
						letterSpacing: "wider",
						color: "wedding.gold",
						mb: "3",
					})}
				>
					<Trophy className={css({ w: "3.5", h: "3.5" })} aria-hidden="true" />
					{t("leaderboardTitle")}
				</h2>
				<ol
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "2",
					})}
				>
					{leaderboard.map((entry, index) => (
						<li
							key={entry.name.toLowerCase()}
							className={css({
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: "3",
								fontSize: "sm",
							})}
						>
							<span
								className={css({
									display: "flex",
									alignItems: "center",
									gap: "2",
									minW: "0",
								})}
							>
								<span
									aria-hidden="true"
									className={css({ fontSize: "lg", lineHeight: "none" })}
								>
									{RANK_MEDALS[index]}
								</span>
								<span
									className={css({
										position: "absolute",
										width: "1px",
										height: "1px",
										padding: "0",
										margin: "-1px",
										overflow: "hidden",
										clip: "rect(0, 0, 0, 0)",
										whiteSpace: "nowrap",
										borderWidth: "0",
									})}
								>
									{t("leaderboardRankAria", { rank: index + 1 })}
								</span>
								<span
									className={css({
										fontWeight: "medium",
										color: "wedding.slate",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									})}
								>
									{entry.name}
								</span>
							</span>
							<Badge
								size="sm"
								className={css({
									flexShrink: "0",
									fontSize: "xs",
									fontWeight: "semibold",
									color: "wedding.gold",
									bg: "amber.50",
									px: "2",
									py: "0.5",
									borderRadius: "full",
								})}
							>
								{t("leaderboardCount", { count: entry.count })}
							</Badge>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
