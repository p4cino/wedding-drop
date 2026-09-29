// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	MediaGridWithModeration,
	type OwnerMediaItem,
} from "@/components/owner/MediaGridWithModeration";

const sampleMedia: OwnerMediaItem[] = [
	{
		id: "med-1",
		uploaderName: "Gość Adam",
		fileType: "image",
		originalFileName: "foto.jpg",
		fileSize: 1024,
		thumbUrl: "/thumb1.jpg",
		rawUrl: "/raw1.jpg",
		status: "ready",
		createdAt: new Date().toISOString(),
	},
	{
		id: "med-2",
		uploaderName: "Świadek Jan",
		fileType: "video",
		originalFileName: "toast.mp4",
		fileSize: 4096,
		thumbUrl: "/thumb2.jpg",
		rawUrl: "/raw2.jpg",
		status: "hidden",
		createdAt: new Date().toISOString(),
	},
];

describe("MediaGridWithModeration Component", () => {
	it("domyślnie pokazuje wszystkie elementy, a filtry (lokalny stan) zawężają listę", () => {
		render(
			<MediaGridWithModeration
				mediaList={sampleMedia}
				onToggleStatus={vi.fn()}
				onDeleteMedia={vi.fn()}
			/>,
		);

		// Wszystkie: widoczny i ukryty element
		expect(screen.getByText("hiddenOverlay")).toBeInTheDocument();
		expect(screen.getAllByRole("img")).toHaveLength(2);

		fireEvent.click(screen.getByText("filterVisible"));
		expect(screen.queryByText("hiddenOverlay")).not.toBeInTheDocument();
		expect(screen.getAllByRole("img")).toHaveLength(1);
		expect(screen.getByText("filterVisible")).toHaveAttribute(
			"aria-pressed",
			"true",
		);

		fireEvent.click(screen.getByText("filterHidden"));
		expect(screen.getByText("hiddenOverlay")).toBeInTheDocument();
		expect(screen.getAllByRole("img")).toHaveLength(1);

		fireEvent.click(screen.getByText("filterAll"));
		expect(screen.getAllByRole("img")).toHaveLength(2);
	});

	it("powinien wywołać akcję ukrycia/pokazania zdjęcia oraz usunięcia", () => {
		const onToggleStatusMock = vi.fn();
		const onDeleteMediaMock = vi.fn();

		render(
			<MediaGridWithModeration
				mediaList={sampleMedia}
				onToggleStatus={onToggleStatusMock}
				onDeleteMedia={onDeleteMediaMock}
			/>,
		);

		// Kliknięcie przełącznika statusu dla pierwszego zdjęcia
		const hideBtn = screen.getByTitle("hideAction");
		fireEvent.click(hideBtn);
		expect(onToggleStatusMock).toHaveBeenCalledWith("med-1", "ready");

		// Kliknięcie przełącznika statusu dla drugiego zdjęcia (pokaż)
		const showBtn = screen.getByTitle("showAction");
		fireEvent.click(showBtn);
		expect(onToggleStatusMock).toHaveBeenCalledWith("med-2", "hidden");

		// Kliknięcie usuwania
		const deleteBtns = screen.getAllByTitle("deleteAction");
		fireEvent.click(deleteBtns[0]);
		expect(onDeleteMediaMock).toHaveBeenCalledWith("med-1");
	});

	it("powinien wyświetlić odznakę fotografa wyłącznie dla materiałów source: photographer", () => {
		const mediaWithPhotographer: OwnerMediaItem[] = [
			...sampleMedia,
			{
				id: "med-3",
				uploaderName: "Fotograf Jan Kowalski",
				source: "photographer",
				fileType: "image",
				originalFileName: "sesja.jpg",
				fileSize: 2048,
				thumbUrl: "/thumb3.jpg",
				rawUrl: "/raw3.jpg",
				status: "ready",
				createdAt: new Date().toISOString(),
			},
		];

		render(
			<MediaGridWithModeration
				mediaList={mediaWithPhotographer}
				onToggleStatus={vi.fn()}
				onDeleteMedia={vi.fn()}
			/>,
		);

		expect(screen.getAllByText("photographerBadge")).toHaveLength(1);
	});
});
