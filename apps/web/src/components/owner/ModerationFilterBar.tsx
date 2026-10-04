"use client";

import { css } from "styled-system/css";
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

const FILTERS: ModerationFilter[] = ["all", "ready", "hidden", "pending"];

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
			className={css({
				display: "flex",
				alignItems: "center",
				gap: "2",
				fontSize: "xs",
				fontWeight: "medium",
			})}
		>
			<span
				className={css({
					color: "slate.600",
					mr: "1",
					fontWeight: "semibold",
				})}
			>
				{title}
			</span>
			{FILTERS.map((filter) => {
				const isSelected = value === filter;
				return (
					<button
						key={filter}
						type="button"
						onClick={() => onChange(filter)}
						aria-pressed={isSelected}
						className={css({
							px: "3",
							py: "1.5",
							borderRadius: "xl",
							transition: "all 0.15s ease",
							cursor: "pointer",
							borderWidth: "0",
							backgroundColor: isSelected ? "slate.900" : "slate.100",
							color: isSelected ? "white" : "slate.600",
							_hover: {
								backgroundColor: isSelected ? "slate.800" : "slate.200",
							},
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "wedding.gold",
							},
						})}
					>
						{labels[filter]}
					</button>
				);
			})}
		</div>
	);
}
