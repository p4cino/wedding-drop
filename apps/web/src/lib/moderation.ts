/** Status elementu widocznego w moderacji właściciela (usunięte nie trafiają do listy). */
export type ModerationStatus = "ready" | "hidden" | "pending";

/** Filtr listy moderacji: wszystkie albo tylko o danym statusie. */
export type ModerationFilter = "all" | ModerationStatus;

export function filterByStatus<T extends { status: ModerationStatus }>(
	items: T[],
	filter: ModerationFilter,
): T[] {
	return filter === "all" ? items : items.filter((i) => i.status === filter);
}

export function countByStatus<T extends { status: ModerationStatus }>(
	items: T[],
	status: ModerationStatus,
): number {
	return items.filter((i) => i.status === status).length;
}

/** Status po przełączeniu „ukryj/pokaż". */
export function toggledStatus(status: ModerationStatus): ModerationStatus {
	if (status === "pending") return "ready";
	return status === "ready" ? "hidden" : "ready";
}
