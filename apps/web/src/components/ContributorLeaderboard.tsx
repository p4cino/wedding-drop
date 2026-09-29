"use client";

import { Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
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
			className="max-w-6xl mx-auto px-4 sm:px-6 mb-5"
		>
			<div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-100 shadow-xs px-4 py-3 sm:px-5 sm:py-4">
				<h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 mb-3">
					<Trophy className="w-3.5 h-3.5" aria-hidden="true" />
					{t("leaderboardTitle")}
				</h2>
				<ol className="flex flex-col gap-2">
					{leaderboard.map((entry, index) => (
						<li
							key={entry.name.toLowerCase()}
							className="flex items-center justify-between gap-3 text-sm"
						>
							<span className="flex items-center gap-2 min-w-0">
								<span aria-hidden="true" className="text-lg leading-none">
									{RANK_MEDALS[index]}
								</span>
								<span className="sr-only">
									{t("leaderboardRankAria", { rank: index + 1 })}
								</span>
								<span className="font-medium text-slate-800 truncate">
									{entry.name}
								</span>
							</span>
							<span className="shrink-0 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
								{t("leaderboardCount", { count: entry.count })}
							</span>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
