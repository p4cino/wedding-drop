import type { MediaItemData } from "@/components/LightboxModal";

export interface LeaderboardEntry {
	/** Wyświetlana etykieta podpisu gościa (pierwszy napotkany, nieznormalizowany zapis). */
	name: string;
	/** Liczba materiałów wgranych przez tego gościa w podanej tablicy `items`. */
	count: number;
}

/**
 * Czysta funkcja agregująca TOP 3 najaktywniejszych gości na podstawie listy
 * materiałów, którą wywołujący już posiada (np. `items` w widoku galerii gościa).
 *
 * Nie wykonuje żadnego I/O i nie filtruje materiałów po statusie (`ready` /
 * `hidden` / `deleted`) — to pozostaje odpowiedzialnością wywołującego, dokładnie
 * tak jak dziś robi to `GET /api/gallery/[slug]/media` przed zwróceniem `items`.
 * Ta funkcja liczy wyłącznie to, co dostanie w tablicy `items`, nic więcej.
 *
 * Grupowanie odbywa się po znormalizowanym kluczu (`trim().toLowerCase()`), ale
 * wyświetlana etykieta to pierwszy napotkany, nieznormalizowany zapis podpisu —
 * zachowuje to naturalny wygląd imienia/nazwiska w UI.
 *
 * Materiały z pustym (lub samymi białymi znakami) podpisem gościa nie są
 * uwzględniane w rankingu — anonimowe wgrania nie powinny rywalizować o miejsce
 * na podium w imieniu żadnego konkretnego gościa.
 */
export function computeLeaderboard(items: MediaItemData[]): LeaderboardEntry[] {
	const counts = new Map<string, LeaderboardEntry>();

	for (const item of items) {
		const raw = (item.uploaderName ?? "").trim();
		const key = raw.toLowerCase();
		if (!key) continue;

		const existing = counts.get(key);
		if (existing) {
			existing.count += 1;
		} else {
			counts.set(key, { name: raw, count: 1 });
		}
	}

	return Array.from(counts.values())
		.sort((a, b) => b.count - a.count)
		.slice(0, 3);
}
