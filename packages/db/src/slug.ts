/**
 * Sanityzacja sluga galerii do postaci `^[a-z0-9_-]*$`.
 *
 * Slug trafia do ścieżek plików i zapytań, więc to niezmiennik bezpieczeństwa
 * (AGENTS.md): wszystko poza małymi literami, cyframi, `_` i `-` jest usuwane.
 * Wynik może być pusty — wołający musi to obsłużyć.
 */
export function sanitizeSlug(input: string): string {
	return input
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, "");
}
