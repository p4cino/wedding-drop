// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ContributorLeaderboard from "@/components/ContributorLeaderboard";
import type { MediaItemData } from "@/components/LightboxModal";

function makeItem(uploaderName: string, id: string): MediaItemData {
	return {
		id,
		uploaderName,
		fileType: "image",
		mimeType: "image/jpeg",
		originalFileName: `${id}.jpg`,
		thumbUrl: `/thumb-${id}.webp`,
		rawUrl: `/raw-${id}.jpg`,
		createdAt: "2026-09-12T12:00:00.000Z",
	};
}

describe("ContributorLeaderboard Component", () => {
	it("nie renderuje żadnego widgetu, gdy lista materiałów jest pusta (0 gości)", () => {
		const { container } = render(<ContributorLeaderboard items={[]} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("nie renderuje widgetu, gdy wszystkie materiały mają pusty podpis gościa", () => {
		const items = [makeItem("", "1"), makeItem("   ", "2")];
		const { container } = render(<ContributorLeaderboard items={items} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renderuje jedną pozycję z medalem 🥇, gdy wgrał tylko jeden gość", () => {
		const items = [makeItem("Świadek Jan", "1"), makeItem("Świadek Jan", "2")];
		render(<ContributorLeaderboard items={items} />);

		expect(screen.getByText("Świadek Jan")).toBeInTheDocument();
		expect(screen.getByText("🥇")).toBeInTheDocument();
		expect(screen.queryByText("🥈")).not.toBeInTheDocument();
		expect(screen.getAllByRole("listitem")).toHaveLength(1);
	});

	it("renderuje dwie pozycje z medalami 🥇🥈, gdy wgrało dwóch gości", () => {
		const items = [
			makeItem("Ciocia Halinka", "1"),
			makeItem("Ciocia Halinka", "2"),
			makeItem("Ciocia Halinka", "3"),
			makeItem("Wujek Staszek", "4"),
		];
		render(<ContributorLeaderboard items={items} />);

		expect(screen.getByText("Ciocia Halinka")).toBeInTheDocument();
		expect(screen.getByText("Wujek Staszek")).toBeInTheDocument();
		expect(screen.getByText("🥇")).toBeInTheDocument();
		expect(screen.getByText("🥈")).toBeInTheDocument();
		expect(screen.queryByText("🥉")).not.toBeInTheDocument();
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
	});

	it("renderuje dokładnie trzy pozycje (🥇🥈🥉) i ukrywa 4. gościa, gdy wgrało 3+ gości", () => {
		const items = [
			makeItem("Gość A", "1"),
			makeItem("Gość A", "2"),
			makeItem("Gość A", "3"),
			makeItem("Gość B", "4"),
			makeItem("Gość B", "5"),
			makeItem("Gość C", "6"),
			makeItem("Gość D", "7"),
		];
		render(<ContributorLeaderboard items={items} />);

		expect(screen.getByText("Gość A")).toBeInTheDocument();
		expect(screen.getByText("Gość B")).toBeInTheDocument();
		expect(screen.getByText("Gość C")).toBeInTheDocument();
		expect(screen.queryByText("Gość D")).not.toBeInTheDocument();

		expect(screen.getByText("🥇")).toBeInTheDocument();
		expect(screen.getByText("🥈")).toBeInTheDocument();
		expect(screen.getByText("🥉")).toBeInTheDocument();
		expect(screen.getAllByRole("listitem")).toHaveLength(3);
	});

	it("grupuje podpisy niewrażliwie na wielkość liter/spacje przed wyświetleniem", () => {
		const items = [
			makeItem("Wujek Janusz", "1"),
			makeItem("wujek janusz ", "2"),
		];
		render(<ContributorLeaderboard items={items} />);

		expect(screen.getAllByRole("listitem")).toHaveLength(1);
		expect(screen.getByText("Wujek Janusz")).toBeInTheDocument();
	});
});
