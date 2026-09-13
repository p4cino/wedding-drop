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
	it("powinien renderować listę multimediów i obsłużyć filtrowanie", () => {
		const setFilterMock = vi.fn();
		const onToggleStatusMock = vi.fn();
		const onDeleteMediaMock = vi.fn();

		const { rerender } = render(
			<MediaGridWithModeration
				mediaList={sampleMedia}
				filter="all"
				setFilter={setFilterMock}
				onToggleStatus={onToggleStatusMock}
				onDeleteMedia={onDeleteMediaMock}
			/>,
		);

		expect(screen.getByText(/Wszystkie \(2\)/)).toBeInTheDocument();
		expect(screen.getByText(/Widoczne \(1\)/)).toBeInTheDocument();
		expect(screen.getByText(/Ukryte \(1\)/)).toBeInTheDocument();

		// Kliknięcie filtrów
		fireEvent.click(screen.getByText(/Wszystkie \(2\)/));
		expect(setFilterMock).toHaveBeenCalledWith("all");

		fireEvent.click(screen.getByText(/Widoczne \(1\)/));
		expect(setFilterMock).toHaveBeenCalledWith("ready");

		fireEvent.click(screen.getByText(/Ukryte \(1\)/));
		expect(setFilterMock).toHaveBeenCalledWith("hidden");

		// Rerender z filtrem "ready"
		rerender(
			<MediaGridWithModeration
				mediaList={sampleMedia}
				filter="ready"
				setFilter={setFilterMock}
				onToggleStatus={onToggleStatusMock}
				onDeleteMedia={onDeleteMediaMock}
			/>,
		);
		expect(screen.queryByText("Ukryte")).not.toBeInTheDocument();

		// Rerender z filtrem "hidden"
		rerender(
			<MediaGridWithModeration
				mediaList={sampleMedia}
				filter="hidden"
				setFilter={setFilterMock}
				onToggleStatus={onToggleStatusMock}
				onDeleteMedia={onDeleteMediaMock}
			/>,
		);
		expect(screen.getByText("Ukryte")).toBeInTheDocument();
	});

	it("powinien wywołać akcję ukrycia/pokazania zdjęcia oraz usunięcia", () => {
		const onToggleStatusMock = vi.fn();
		const onDeleteMediaMock = vi.fn();

		render(
			<MediaGridWithModeration
				mediaList={sampleMedia}
				filter="all"
				setFilter={vi.fn()}
				onToggleStatus={onToggleStatusMock}
				onDeleteMedia={onDeleteMediaMock}
			/>,
		);

		// Kliknięcie przełącznika statusu dla pierwszego zdjęcia
		const hideBtn = screen.getByTitle("Ukryj przed gośćmi");
		fireEvent.click(hideBtn);
		expect(onToggleStatusMock).toHaveBeenCalledWith("med-1", "ready");

		// Kliknięcie przełącznika statusu dla drugiego zdjęcia (pokaż)
		const showBtn = screen.getByTitle("Pokaż w galerii");
		fireEvent.click(showBtn);
		expect(onToggleStatusMock).toHaveBeenCalledWith("med-2", "hidden");

		// Kliknięcie usuwania
		const deleteBtns = screen.getAllByTitle("Usuń bezpowrotnie");
		fireEvent.click(deleteBtns[0]);
		expect(onDeleteMediaMock).toHaveBeenCalledWith("med-1");
	});
});
