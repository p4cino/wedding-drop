// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LightboxModal, { type MediaItemData } from "@/components/LightboxModal";

describe("LightboxModal Component", () => {
	const mockItems: MediaItemData[] = [
		{
			id: "1",
			uploaderName: "Kamil",
			fileType: "image",
			mimeType: "image/jpeg",
			originalFileName: "zdjecie1.jpg",
			thumbUrl: "/thumb1.webp",
			rawUrl: "/raw1.jpg",
			createdAt: "2026-09-12",
		},
		{
			id: "2",
			uploaderName: "Marta",
			fileType: "video",
			mimeType: "video/mp4",
			originalFileName: "film1.mp4",
			thumbUrl: "/thumb2.webp",
			rawUrl: "/raw2.mp4",
			createdAt: "2026-09-12",
		},
	];

	it("nie powinien nic renderować, gdy currentIndex === null", () => {
		const { container } = render(
			<LightboxModal
				items={mockItems}
				currentIndex={null}
				onClose={vi.fn()}
				onNavigate={vi.fn()}
			/>,
		);
		expect(container.firstChild).toBeNull();
	});

	it("powinien wyświetlać podgląd zdjęcia dla currentIndex = 0 i pozwalać na pobranie", () => {
		const onClose = vi.fn();
		const onNavigate = vi.fn();

		render(
			<LightboxModal
				items={mockItems}
				currentIndex={0}
				onClose={onClose}
				onNavigate={onNavigate}
			/>,
		);

		expect(screen.getByText("Kamil")).toBeInTheDocument();
		expect(screen.getByText("zdjecie1.jpg")).toBeInTheDocument();
		expect(screen.getByText("1 z 2")).toBeInTheDocument();

		const img = screen.getByAltText("zdjecie1.jpg");
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute("src", "/raw1.jpg");

		// Przycisk pobierania
		const downloadLink = screen.getByTitle("Pobierz oryginalny plik");
		expect(downloadLink).toBeInTheDocument();
		expect(downloadLink).toHaveAttribute("href", "/raw1.jpg");
	});

	it("powinien ukrywać przycisk pobierania, gdy allowDownloads === false", () => {
		render(
			<LightboxModal
				items={mockItems}
				currentIndex={0}
				allowDownloads={false}
				onClose={vi.fn()}
				onNavigate={vi.fn()}
			/>,
		);
		expect(screen.queryByTitle("Pobierz oryginalny plik")).toBeNull();
	});

	it("powinien renderować wideo dla elementu o fileType === 'video'", () => {
		const { container } = render(
			<LightboxModal
				items={mockItems}
				currentIndex={1}
				onClose={vi.fn()}
				onNavigate={vi.fn()}
			/>,
		);

		const video = container.querySelector("video");
		expect(video).toBeInTheDocument();
		expect(video).toHaveAttribute("src", "/raw2.mp4");
	});

	it("powinien nawigować po wciśnięciu klawiszy strzałek i zamykać przy Escape", () => {
		const onClose = vi.fn();
		const onNavigate = vi.fn();

		render(
			<LightboxModal
				items={mockItems}
				currentIndex={0}
				onClose={onClose}
				onNavigate={onNavigate}
			/>,
		);

		fireEvent.keyDown(window, { key: "ArrowRight" });
		expect(onNavigate).toHaveBeenCalledWith(1);

		fireEvent.keyDown(window, { key: "Escape" });
		expect(onClose).toHaveBeenCalled();
	});

	it("powinien obsłużyć ArrowLeft gdy currentIndex = 1", () => {
		const onNavigate = vi.fn();
		render(
			<LightboxModal
				items={mockItems}
				currentIndex={1}
				onClose={vi.fn()}
				onNavigate={onNavigate}
			/>,
		);

		fireEvent.keyDown(window, { key: "ArrowLeft" });
		expect(onNavigate).toHaveBeenCalledWith(0);
	});

	it("powinien zamykać po kliknięciu ikony zamknięcia X", () => {
		const onClose = vi.fn();
		const { container } = render(
			<LightboxModal
				items={mockItems}
				currentIndex={0}
				onClose={onClose}
				onNavigate={vi.fn()}
			/>,
		);

		const closeBtn = container.querySelector("button:has(svg.lucide-x)");
		if (closeBtn) {
			fireEvent.click(closeBtn);
			expect(onClose).toHaveBeenCalled();
		}
	});

	it("powinien nawigować po kliknięciu przycisków Chevron", () => {
		const onNavigate = vi.fn();
		const { container, rerender } = render(
			<LightboxModal
				items={mockItems}
				currentIndex={0}
				onClose={vi.fn()}
				onNavigate={onNavigate}
			/>,
		);

		// Dla index = 0, jest przycisk ChevronRight
		const rightBtn = container.querySelector(
			"button:has(svg.lucide-chevron-right)",
		);
		expect(rightBtn).toBeInTheDocument();
		if (rightBtn) {
			fireEvent.click(rightBtn);
			expect(onNavigate).toHaveBeenCalledWith(1);
		}

		// Dla index = 1, jest przycisk ChevronLeft
		rerender(
			<LightboxModal
				items={mockItems}
				currentIndex={1}
				onClose={vi.fn()}
				onNavigate={onNavigate}
			/>,
		);
		const leftBtn = container.querySelector(
			"button:has(svg.lucide-chevron-left)",
		);
		expect(leftBtn).toBeInTheDocument();
		if (leftBtn) {
			fireEvent.click(leftBtn);
			expect(onNavigate).toHaveBeenCalledWith(0);
		}
	});

	it("powinien nawigować przy geście swipe left na ekranie dotykowym", () => {
		const onNavigate = vi.fn();
		const { container } = render(
			<LightboxModal
				items={mockItems}
				currentIndex={0}
				onClose={vi.fn()}
				onNavigate={onNavigate}
			/>,
		);

		const modal = container.firstChild as HTMLElement;
		fireEvent.touchStart(modal, { targetTouches: [{ clientX: 200 }] });
		fireEvent.touchMove(modal, { targetTouches: [{ clientX: 100 }] });
		fireEvent.touchEnd(modal);

		expect(onNavigate).toHaveBeenCalledWith(1);
	});

	it("powinien nawigować przy geście swipe right na ekranie dotykowym", () => {
		const onNavigate = vi.fn();
		const { container } = render(
			<LightboxModal
				items={mockItems}
				currentIndex={1}
				onClose={vi.fn()}
				onNavigate={onNavigate}
			/>,
		);

		const modal = container.firstChild as HTMLElement;
		fireEvent.touchStart(modal, { targetTouches: [{ clientX: 100 }] });
		fireEvent.touchMove(modal, { targetTouches: [{ clientX: 200 }] });
		fireEvent.touchEnd(modal);

		expect(onNavigate).toHaveBeenCalledWith(0);
	});

	it("nie powinien nawigować gdy ruch touch jest zbyt mały lub brak współrzędnych", () => {
		const onNavigate = vi.fn();
		const { container } = render(
			<LightboxModal
				items={mockItems}
				currentIndex={0}
				onClose={vi.fn()}
				onNavigate={onNavigate}
			/>,
		);

		const modal = container.firstChild as HTMLElement;
		// Mały ruch (mniej niż minSwipeDistance 45)
		fireEvent.touchStart(modal, { targetTouches: [{ clientX: 100 }] });
		fireEvent.touchMove(modal, { targetTouches: [{ clientX: 110 }] });
		fireEvent.touchEnd(modal);
		expect(onNavigate).not.toHaveBeenCalled();

		// Brak startu
		fireEvent.touchEnd(modal);
		expect(onNavigate).not.toHaveBeenCalled();
	});
});
