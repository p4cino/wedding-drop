import { describe, expect, it } from "vitest";
import {
	countMediaByQuest,
	DEFAULT_QUEST_TEMPLATES,
	findQuestTitle,
	generateQuestId,
	getActiveQuests,
	type QuestsConfig,
} from "@/lib/photo-quests";

describe("photo-quests helpers", () => {
	it("udostępnia domyślne szablony wyzwań weselnych", () => {
		expect(DEFAULT_QUEST_TEMPLATES.length).toBeGreaterThanOrEqual(6);
		for (const tpl of DEFAULT_QUEST_TEMPLATES) {
			expect(tpl.id).toMatch(/^[a-z0-9_-]{1,40}$/);
			expect(tpl.defaultTitle.length).toBeGreaterThanOrEqual(2);
		}
	});

	it("generateQuestId normalizuje polskie i niemieckie znaki diakrytyczne do ^[a-z0-9_-]{1,40}$", () => {
		expect(generateQuestId("Selfie z Parą Młodą!")).toBe("selfie-z-para-mloda");
		expect(generateQuestId("Zażółć gęślą jaźń")).toBe("zazolc-gesla-jazn");
		expect(generateQuestId("Süßestes Paar & Überraschung")).toBe(
			"sussestes-paar-uberraschung",
		);
		expect(generateQuestId("!!!")).toBe("quest");

		const longId = generateQuestId("A".repeat(100));
		expect(longId.length).toBeLessThanOrEqual(40);
		expect(longId).toMatch(/^[a-z0-9_-]{1,40}$/);
	});

	it("generateQuestId unika kolizji, gdy podano existingIds", () => {
		const id1 = generateQuestId("Pierwszy taniec", ["pierwszy-taniec"]);
		expect(id1).toBe("pierwszy-taniec-2");

		const id2 = generateQuestId("Pierwszy taniec", [
			"pierwszy-taniec",
			"pierwszy-taniec-2",
		]);
		expect(id2).toBe("pierwszy-taniec-3");
	});

	it("getActiveQuests zwraca zadania tylko wtedy, gdy enabled === true", () => {
		const items = [
			{ id: "selfie", title: "Selfie z Parą Młodą" },
			{ id: "toast", title: "Toast przy stoliku" },
		];
		expect(getActiveQuests(null)).toEqual([]);
		expect(getActiveQuests(undefined)).toEqual([]);
		expect(getActiveQuests({ enabled: false, items })).toEqual([]);
		expect(getActiveQuests({ enabled: true, items })).toEqual(items);
	});

	it("findQuestTitle rozwiązuje tytuł aktywnego wyzwania (z przycięciem białych znaków) lub zwraca null", () => {
		const config: QuestsConfig = {
			enabled: true,
			items: [{ id: "first-dance", title: "  Pierwszy taniec  " }],
		};

		expect(findQuestTitle(config, "first-dance")).toBe("Pierwszy taniec");
		expect(findQuestTitle(config, "  first-dance  ")).toBe("Pierwszy taniec");
		expect(findQuestTitle(config, "   ")).toBeNull();
		expect(findQuestTitle(config, "unknown")).toBeNull();
		expect(findQuestTitle(config, null)).toBeNull();
		expect(
			findQuestTitle({ ...config, enabled: false }, "first-dance"),
		).toBeNull();
	});

	it("countMediaByQuest zlicza materiały przypisane do poszczególnych wyzwań", () => {
		const counts = countMediaByQuest([
			{ id: "1", questId: "selfie" },
			{ id: "2", questId: "selfie" },
			{ id: "3", questId: "toast" },
			{ id: "4", questId: null },
			{ id: "5" },
		]);

		expect(counts).toEqual({
			selfie: 2,
			toast: 1,
		});
	});
});
