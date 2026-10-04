// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MediaItemData } from "@/components/LightboxModal";
import MediaGrid from "@/components/MediaGrid";

describe("MediaGrid Component", () => {
	it("powinien wyświetlać komunikat o pustej galerii, gdy brak elementów", () => {
		render(<MediaGrid items={[]} onItemClick={vi.fn()} />);
		expect(screen.getByText("noPhotos")).toBeInTheDocument();
	});

	it("powinien renderować listę miniatur zdjęć i filmów oraz obsługiwać kliknięcie", () => {
		const mockItems: MediaItemData[] = [
			{
				id: "1",
				uploaderName: "Wujek Staszek",
				fileType: "image",
				mimeType: "image/jpeg",
				originalFileName: "taniec.jpg",
				thumbUrl: "/thumb1.webp",
				rawUrl: "/raw1.jpg",
				createdAt: "2026-09-12",
			},
			{
				id: "2",
				uploaderName: "", // Test domyślnego podpisu "Gość"
				fileType: "video",
				mimeType: "video/mp4",
				originalFileName: "toast.mp4",
				thumbUrl: "/thumb2.webp",
				rawUrl: "/raw2.mp4",
				createdAt: "2026-09-12",
			},
		];

		const onItemClick = vi.fn();
		render(<MediaGrid items={mockItems} onItemClick={onItemClick} />);

		expect(screen.getByText("Wujek Staszek")).toBeInTheDocument();
		expect(screen.getByText("defaultUploaderName")).toBeInTheDocument();

		// Kliknięcie w pierwsze zdjęcie
		const images = screen.getAllByRole("img");
		expect(images.length).toBe(2);
		fireEvent.click(images[0]);
		expect(onItemClick).toHaveBeenCalledWith(0);

		// Kliknięcie w drugie zdjęcie
		fireEvent.click(images[1]);
		expect(onItemClick).toHaveBeenCalledWith(1);
	});

	it("powinien wyświetlić odznakę fotografa wyłącznie dla materiałów source: photographer", () => {
		const mockItems: MediaItemData[] = [
			{
				id: "1",
				uploaderName: "Wujek Staszek",
				source: "guest",
				fileType: "image",
				mimeType: "image/jpeg",
				originalFileName: "taniec.jpg",
				thumbUrl: "/thumb1.webp",
				rawUrl: "/raw1.jpg",
				createdAt: "2026-09-12",
			},
			{
				id: "2",
				uploaderName: "Fotograf Jan Kowalski",
				source: "photographer",
				fileType: "image",
				mimeType: "image/jpeg",
				originalFileName: "sesja.jpg",
				thumbUrl: "/thumb2.webp",
				rawUrl: "/raw2.jpg",
				createdAt: "2026-09-12",
			},
		];

		render(<MediaGrid items={mockItems} onItemClick={vi.fn()} />);

		expect(screen.getAllByText("photographerBadge")).toHaveLength(1);
	});

	it("aria-label elementu zaczyna się od przetłumaczonego typu (zdjęcie/wideo)", () => {
		const base = {
			uploaderName: "X",
			mimeType: "x",
			thumbUrl: "/t",
			rawUrl: "/r",
			createdAt: "2026-09-12",
		};
		render(
			<MediaGrid
				items={[
					{ ...base, id: "1", fileType: "image", originalFileName: "a.jpg" },
					{ ...base, id: "2", fileType: "video", originalFileName: "b.mp4" },
				]}
				onItemClick={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("button", { name: /^imageAria: a\.jpg,/ }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /^videoAria: b\.mp4,/ }),
		).toBeInTheDocument();
	});

	it("renderuje nagranie audio jako ikonę (bez <img>) z etykietą i18n", () => {
		const items: MediaItemData[] = [
			{
				id: "a1",
				uploaderName: "Babcia",
				fileType: "audio",
				mediaType: "audio",
				mimeType: "audio/webm",
				originalFileName: "zyczenia.webm",
				thumbUrl: "/raw/zyczenia.webm",
				rawUrl: "/raw/zyczenia.webm",
				createdAt: "2026-09-12",
			},
		];
		render(<MediaGrid items={items} onItemClick={vi.fn()} />);

		expect(screen.queryByRole("img")).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /^audioAria: zyczenia\.webm/ }),
		).toBeInTheDocument();
	});
});
