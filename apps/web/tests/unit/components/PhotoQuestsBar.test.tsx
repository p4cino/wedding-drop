// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PhotoQuestsBar from "@/components/PhotoQuestsBar";
import type { MediaItemData } from "@/lib/gallery-types";
import type { QuestsConfig } from "@/lib/photo-quests";

function makeMedia(
	id: string,
	questId?: string | null,
): MediaItemData & {
	questId?: string | null;
} {
	return {
		id,
		uploaderName: "Gość",
		fileType: "image",
		mimeType: "image/jpeg",
		originalFileName: `${id}.jpg`,
		thumbUrl: `/t-${id}.webp`,
		rawUrl: `/r-${id}.jpg`,
		createdAt: "2026-09-12T12:00:00.000Z",
		questId,
	};
}

describe("PhotoQuestsBar Component", () => {
	const activeConfig: QuestsConfig = {
		enabled: true,
		items: [
			{ id: "selfie", title: "Selfie z Parą Młodą" },
			{ id: "taniec", title: "Pierwszy taniec" },
		],
	};

	it("nie renderuje niczego, gdy wyzwania są wyłączone lub puste", () => {
		const { container, rerender } = render(
			<PhotoQuestsBar
				questsConfig={{ enabled: false, items: activeConfig.items }}
				items={[]}
				selectedQuestId={null}
				onSelectQuest={vi.fn()}
			/>,
		);
		expect(container).toBeEmptyDOMElement();

		rerender(
			<PhotoQuestsBar
				questsConfig={{ enabled: true, items: [] }}
				items={[]}
				selectedQuestId={null}
				onSelectQuest={vi.fn()}
			/>,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("renderuje pigułki wyzwań z licznikami zdjęć, obsługuje filtrowanie oraz przycisk uploadu", () => {
		const onSelectQuest = vi.fn();
		const onUploadForQuest = vi.fn();
		const items = [
			makeMedia("1", "selfie"),
			makeMedia("2", "selfie"),
			makeMedia("3", null),
		];

		render(
			<PhotoQuestsBar
				questsConfig={activeConfig}
				items={items}
				selectedQuestId="selfie"
				onSelectQuest={onSelectQuest}
				onUploadForQuest={onUploadForQuest}
			/>,
		);

		expect(screen.getByText("questsTitle")).toBeInTheDocument();
		expect(screen.getByText("Selfie z Parą Młodą")).toBeInTheDocument();
		expect(screen.getByText("Pierwszy taniec")).toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();
		expect(screen.getByText("0")).toBeInTheDocument();

		// Kliknięcie pigułki innego wyzwania ustawia filtr
		fireEvent.click(screen.getByText("Pierwszy taniec"));
		expect(onSelectQuest).toHaveBeenCalledWith("taniec");

		// Kliknięcie aktualnie wybranego wyzwania zdejmuje filtr
		fireEvent.click(screen.getByText("Selfie z Parą Młodą"));
		expect(onSelectQuest).toHaveBeenCalledWith(null);

		// Kliknięcie "Wszystkie" resetuje filtr
		fireEvent.click(screen.getByText("questsAllFilter"));
		expect(onSelectQuest).toHaveBeenCalledWith(null);

		// Kliknięcie przycisku dodawania zdjęcia do wyzwania przekazuje wybrane wyzwanie
		fireEvent.click(screen.getByText("questUploadBtn"));
		expect(onUploadForQuest).toHaveBeenCalledWith("selfie");
	});
});
