// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UploaderDrawer from "@/components/UploaderDrawer";

let shouldFailUpload = false;

interface TusMockOptions {
	onError: (err: Error) => void;
	onProgress: (bytesUploaded: number, bytesTotal: number) => void;
	onSuccess: () => void;
}

vi.mock("tus-js-client", () => ({
	Upload: vi.fn().mockImplementation(function (
		_file: unknown,
		options: TusMockOptions,
	) {
		return {
			start: () => {
				if (shouldFailUpload) {
					options.onError(new Error("Błąd sieci"));
				} else {
					options.onProgress(50, 100);
					options.onSuccess();
				}
			},
		};
	}),
}));

describe("UploaderDrawer Component", () => {
	beforeEach(() => {
		shouldFailUpload = false;
	});

	it("nie powinien renderować niczego, gdy isOpen === false", () => {
		const { container } = render(
			<UploaderDrawer
				gallerySlug="kasia-i-tomek"
				isOpen={false}
				onClose={vi.fn()}
			/>,
		);
		expect(container.firstChild).toBeNull();
	});

	it("powinien renderować formularz, obsługiwać wybór pliku, upload wideo i zamykanie", async () => {
		const onClose = vi.fn();
		const onUploadSuccess = vi.fn();

		const { container } = render(
			<UploaderDrawer
				gallerySlug="kasia-i-tomek"
				isOpen={true}
				onClose={onClose}
				onUploadSuccess={onUploadSuccess}
			/>,
		);

		expect(screen.getByText("Dodaj zdjęcia i filmy")).toBeInTheDocument();

		// Wpisanie podpisu
		const nameInput = screen.getByPlaceholderText(
			/np. Ciocia Kasia i Wujek Michał/i,
		);
		fireEvent.change(nameInput, { target: { value: "Wujek Zdzichu" } });
		expect(nameInput).toHaveValue("Wujek Zdzichu");

		// Wybór wideo
		const file = new File(["test-content"], "taniec.mp4", {
			type: "video/mp4",
		});
		const fileInput = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;

		fireEvent.change(fileInput, { target: { files: [file] } });

		// Plik powinien pojawić się na liście
		expect(screen.getByText("taniec.mp4")).toBeInTheDocument();

		// Kliknięcie "Wyślij do galerii"
		const uploadBtn = screen.getByRole("button", {
			name: /Wyślij do galerii/i,
		});
		fireEvent.click(uploadBtn);

		await waitFor(() => {
			expect(screen.getByText(/Gotowe, wróć do galerii/i)).toBeInTheDocument();
		});

		const doneBtn = screen.getByRole("button", {
			name: /Gotowe, wróć do galerii/i,
		});
		fireEvent.click(doneBtn);
		expect(onClose).toHaveBeenCalled();
	});

	it("powinien pozwalać na usunięcie pliku z listy przed wysłaniem", async () => {
		const { container } = render(
			<UploaderDrawer
				gallerySlug="kasia-i-tomek"
				isOpen={true}
				onClose={vi.fn()}
			/>,
		);

		const file = new File(["photo"], "foto.jpg", { type: "image/jpeg" });
		const fileInput = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(screen.getByText("foto.jpg")).toBeInTheDocument();

		// Usunięcie pliku
		const deleteBtn = container.querySelector("button.hover\\:text-red-500");
		expect(deleteBtn).toBeInTheDocument();
		if (deleteBtn) {
			fireEvent.click(deleteBtn);
		}

		expect(screen.queryByText("foto.jpg")).toBeNull();
	});

	it("powinien obsłużyć błąd uploadu dla pliku", async () => {
		shouldFailUpload = true;
		const { container } = render(
			<UploaderDrawer
				gallerySlug="kasia-i-tomek"
				isOpen={true}
				onClose={vi.fn()}
			/>,
		);

		const file = new File(["photo"], "problem.jpg", { type: "image/jpeg" });
		const fileInput = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		fireEvent.change(fileInput, { target: { files: [file] } });

		const uploadBtn = screen.getByRole("button", {
			name: /Wyślij do galerii/i,
		});
		fireEvent.click(uploadBtn);

		await waitFor(() => {
			expect(container.querySelector(".text-red-500")).toBeInTheDocument();
		});
	});
});
