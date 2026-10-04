"use client";

import { Check, Eye, EyeOff, Trash2 } from "lucide-react";
import { css } from "styled-system/css";
import type { ModerationStatus } from "@/lib/moderation";

interface ModerationActionsProps {
	status: ModerationStatus;
	toggleLabel: string;
	deleteLabel: string;
	/** Podpowiedź (title) przycisku ukryj/pokaż; domyślnie taka jak etykieta. */
	toggleTitle?: string;
	deleteTitle?: string;
	onToggle: () => void;
	onDelete: () => void;
}

/** Przyciski „ukryj/pokaż" i „usuń" wspólne dla zdjęć i życzeń. */
export function ModerationActions({
	status,
	toggleLabel,
	deleteLabel,
	toggleTitle,
	deleteTitle,
	onToggle,
	onDelete,
}: ModerationActionsProps) {
	const isReady = status === "ready";
	const isPending = status === "pending";
	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				gap: "1",
				flexShrink: 0,
			})}
		>
			<button
				type="button"
				onClick={onToggle}
				title={toggleTitle ?? toggleLabel}
				aria-label={toggleLabel}
				className={css({
					p: "1.5",
					borderRadius: "lg",
					transition: "all 0.15s ease",
					cursor: "pointer",
					borderWidth: "0",
					color: isReady
						? "slate.600"
						: isPending
							? "green.600"
							: "wedding.gold",
					backgroundColor: isReady
						? "transparent"
						: isPending
							? "green.50"
							: "amber.50",
					_hover: {
						color: isReady
							? "slate.900"
							: isPending
								? "green.700"
								: "wedding.gold",
						backgroundColor: isReady
							? "slate.100"
							: isPending
								? "green.100"
								: "amber.100",
					},
					_focusVisible: {
						outline: "2px solid",
						outlineColor: isPending ? "green.500" : "wedding.gold",
					},
				})}
			>
				{isPending ? (
					<Check className={css({ w: "3.5", h: "3.5" })} aria-hidden="true" />
				) : isReady ? (
					<Eye className={css({ w: "3.5", h: "3.5" })} aria-hidden="true" />
				) : (
					<EyeOff className={css({ w: "3.5", h: "3.5" })} aria-hidden="true" />
				)}
			</button>

			<button
				type="button"
				onClick={onDelete}
				title={deleteTitle ?? deleteLabel}
				aria-label={deleteLabel}
				className={css({
					p: "1.5",
					borderRadius: "lg",
					color: "slate.600",
					backgroundColor: "transparent",
					borderWidth: "0",
					cursor: "pointer",
					transition: "all 0.15s ease",
					_hover: {
						color: "red.600",
						backgroundColor: "red.50",
					},
					_focusVisible: {
						outline: "2px solid",
						outlineColor: "red.500",
					},
				})}
			>
				<Trash2 className={css({ w: "3.5", h: "3.5" })} aria-hidden="true" />
			</button>
		</div>
	);
}
