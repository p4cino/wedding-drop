import type { QuestItem, QuestsConfig } from "@wedding-drop/db";
import type { MediaItemData } from "@/lib/gallery-types";

export type { QuestItem, QuestsConfig };

export const QUEST_TEMPLATE_KEYS = [
	"questTplSelfieCouple",
	"questTplTableToast",
	"questTplFirstDance",
	"questTplDancefloorMove",
	"questTplGrandparents",
	"questTplSweetestCouple",
] as const;

export type QuestTemplateKey = (typeof QUEST_TEMPLATE_KEYS)[number];

export interface QuestTemplate {
	id: string;
	key: QuestTemplateKey;
	defaultTitle: string;
}

/**
 * Domyślne szablony wyzwań weselnych (z kluczem tłumaczeń w `OwnerPanel` oraz
 * czytelnym tytułem domyślnym).
 */
export const DEFAULT_QUEST_TEMPLATES: readonly QuestTemplate[] = [
	{
		id: "selfie-z-para-mloda",
		key: "questTplSelfieCouple",
		defaultTitle: "Selfie z Parą Młodą",
	},
	{
		id: "toast-przy-naszym-stoliku",
		key: "questTplTableToast",
		defaultTitle: "Toast przy naszym stoliku",
	},
	{
		id: "pierwszy-taniec",
		key: "questTplFirstDance",
		defaultTitle: "Pierwszy taniec",
	},
	{
		id: "najlepszy-ruch-na-parkiecie",
		key: "questTplDancefloorMove",
		defaultTitle: "Najlepszy ruch na parkiecie",
	},
	{
		id: "zdjecie-z-dziadkami",
		key: "questTplGrandparents",
		defaultTitle: "Zdjęcie z dziadkami",
	},
	{
		id: "najslodsza-para-wieczoru",
		key: "questTplSweetestCouple",
		defaultTitle: "Najsłodsza para wieczoru",
	},
];

const DIACRITIC_MAP: Record<string, string> = {
	ą: "a",
	ć: "c",
	ę: "e",
	ł: "l",
	ń: "n",
	ó: "o",
	ś: "s",
	ź: "z",
	ż: "z",
	ä: "a",
	ö: "o",
	ü: "u",
	ß: "ss",
};

/**
 * Generuje bezpieczny identyfikator wyzwania zgodny z `^[a-z0-9_-]{1,40}$`.
 * Jeśli podano `existingIds`, w razie kolizji dokleja sufiks `-2`, `-3`, itd.
 */
export function generateQuestId(
	title: string,
	existingIds?: Iterable<string>,
): string {
	const normalized = title
		.toLowerCase()
		.replace(/[ąćęłńóśźżäöüß]/g, (ch) => DIACRITIC_MAP[ch] ?? ch)
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9_-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");

	const base =
		(normalized || "quest").slice(0, 40).replace(/-+$/g, "") || "quest";

	if (!existingIds) {
		return base;
	}

	const taken = new Set(existingIds);
	if (!taken.has(base)) {
		return base;
	}

	let counter = 2;
	while (taken.has(`${base.slice(0, 36)}-${counter}`)) {
		counter += 1;
	}
	return `${base.slice(0, 36)}-${counter}`;
}

/**
 * Zwraca listę aktywnych wyzwań galerii (pusta tablica, gdy wyzwania są wyłączone
 * lub konfiguracja nie istnieje).
 */
export function getActiveQuests(
	config?: QuestsConfig | { enabled?: boolean; items?: QuestItem[] } | null,
): QuestItem[] {
	if (!config?.enabled || !Array.isArray(config.items)) {
		return [];
	}
	return config.items.filter((item): item is QuestItem =>
		Boolean(
			item &&
				typeof item.id === "string" &&
				item.id.trim().length > 0 &&
				typeof item.title === "string" &&
				item.title.trim().length > 0,
		),
	);
}

/**
 * Wyszukuje tytuł aktywnego wyzwania po `questId`. Zwraca `null`, gdy wyzwania
 * są wyłączone, `questId` jest puste lub wyzwanie nie istnieje.
 */
export function findQuestTitle(
	config:
		| QuestsConfig
		| { enabled?: boolean; items?: QuestItem[] }
		| null
		| undefined,
	questId?: string | null,
): string | null {
	const id = questId?.trim();
	if (!id) return null;
	const found = getActiveQuests(config).find((q) => q.id === id);
	const title = found?.title?.trim();
	return title || null;
}

/**
 * Zlicza liczbę materiałów przypisanych do każdego `questId` w przekazanej liście
 * widocznych materiałów galerii.
 */
export function countMediaByQuest(
	items: ReadonlyArray<Pick<MediaItemData, "id" | "questId">>,
): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const item of items) {
		const qId = item.questId?.trim();
		if (!qId) continue;
		counts[qId] = (counts[qId] ?? 0) + 1;
	}
	return counts;
}
