"use client";

import type { ModerationFilter } from "@/lib/moderation";

interface ModerationFilterBarProps {
	value: ModerationFilter;
	onChange: (filter: ModerationFilter) => void;
	/** Etykieta grupy dla czytników ekranu. */
	groupLabel: string;
	/** Tekst przed przyciskami (np. „Filtruj:"). */
	title: string;
	labels: Record<ModerationFilter, string>;
}

const FILTERS: ModerationFilter[] = ["all", "ready", "hidden"];

/** Pasek filtrów „wszystkie / widoczne / ukryte" wspólny dla zdjęć i życzeń. */
export function ModerationFilterBar({
	value,
	onChange,
	groupLabel,
	title,
	labels,
}: ModerationFilterBarProps) {
	return (
		<div
			role="group"
			aria-label={groupLabel}
			className="flex items-center gap-2 text-xs font-medium"
		>
			<span className="text-slate-600 mr-1 font-semibold">{title}</span>
			{FILTERS.map((filter) => (
				<button
					key={filter}
					type="button"
					onClick={() => onChange(filter)}
					aria-pressed={value === filter}
					className={`px-3 py-1.5 rounded-xl transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
						value === filter
							? "bg-slate-900 text-white"
							: "bg-slate-100 text-slate-600 hover:bg-slate-200"
					}`}
				>
					{labels[filter]}
				</button>
			))}
		</div>
	);
}
