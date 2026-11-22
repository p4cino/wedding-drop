// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TvMediaOverlay from "@/components/tv/TvMediaOverlay";
import type { MediaItemData } from "@/lib/gallery-types";

function makeMedia(overrides: Partial<MediaItemData> = {}): MediaItemData {
	return {
		id: "m1",
		uploaderName: "Wujek Janusz",
		fileType: "image",
		mimeType: "image/jpeg",
		originalFileName: "foto.jpg",
		thumbUrl: "/t.webp",
		rawUrl: "/r.jpg",
		createdAt: "2026-06-01T12:00:00.000Z",
		...overrides,
	};
}

describe("TvMediaOverlay", () => {
	it("renderuje wyzwanie, licznik serduszek, podpis oraz autora", () => {
		render(
			<TvMediaOverlay
				media={makeMedia({
					caption: "Stolik nr 4 bawi się najlepiej!",
					likesCount: 12,
				})}
				questTitle="Selfie z Parą Młodą"
			/>,
		);

		expect(screen.getByTestId("tv-media-overlay")).toBeInTheDocument();
		expect(screen.getByTestId("tv-quest-badge")).toHaveTextContent(
			"Selfie z Parą Młodą",
		);
		expect(screen.getByTestId("tv-likes-badge")).toHaveTextContent("12");
		expect(screen.getByTestId("tv-media-caption")).toHaveTextContent(
			"Stolik nr 4 bawi się najlepiej!",
		);
		expect(screen.getByText(/Wujek Janusz/)).toBeInTheDocument();
	});

	it("ukrywa licznik serduszek, gdy likesCount wynosi 0, i nie renderuje pustej nakładki", () => {
		const { container } = render(
			<TvMediaOverlay
				media={makeMedia({ uploaderName: "", caption: null, likesCount: 0 })}
				questTitle={null}
			/>,
		);

		expect(container).toBeEmptyDOMElement();
	});
});
