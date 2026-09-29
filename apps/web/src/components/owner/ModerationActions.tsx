"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
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
	return (
		<div className="flex items-center gap-1 shrink-0">
			<button
				type="button"
				onClick={onToggle}
				title={toggleTitle ?? toggleLabel}
				aria-label={toggleLabel}
				className={`p-1.5 rounded-lg transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
					isReady
						? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
						: "text-amber-600 bg-amber-50 hover:bg-amber-100"
				}`}
			>
				{isReady ? (
					<Eye className="w-3.5 h-3.5" aria-hidden="true" />
				) : (
					<EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
				)}
			</button>

			<button
				type="button"
				onClick={onDelete}
				title={deleteTitle ?? deleteLabel}
				aria-label={deleteLabel}
				className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
			>
				<Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
			</button>
		</div>
	);
}
