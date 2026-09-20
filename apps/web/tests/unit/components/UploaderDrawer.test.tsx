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

vi.mock("tus-js-client", () => {
	class MockUpload {
		options: TusMockOptions;
		constructor(_file: unknown, options: TusMockOptions) {
			this.options = options;
		}
		start() {
			if (shouldFailUpload) {
				this.options.onError(new Error("Błąd sieci"));
			} else {
				this.options.onProgress(50, 100);
				this.options.onSuccess();
			}
		}
	}
	return {
		Upload: MockUpload,
	};
});

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

		expect(screen.getByText("drawerTitle")).toBeInTheDocument();

		// Wpisanie podpisu
		const nameInput = screen.getByPlaceholderText("signaturePlaceholder");
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
			name: "submitBtn",
		});
		fireEvent.click(uploadBtn);

		await waitFor(() => {
			expect(screen.getByText("doneBtn")).toBeInTheDocument();
		});

		const doneBtn = screen.getByRole("button", {
			name: "doneBtn",
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
			name: "submitBtn",
		});
		fireEvent.click(uploadBtn);

		await waitFor(() => {
			expect(container.querySelector(".text-red-500")).toBeInTheDocument();
		});
	});

	it("powinien wywołać click na ukrytym input[type=file] po kliknięciu strefy drop", () => {
		const { container } = render(
			<UploaderDrawer
				gallerySlug="kasia-i-tomek"
				isOpen={true}
				onClose={vi.fn()}
			/>,
		);

		const fileInput = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		const clickSpy = vi.spyOn(fileInput, "click");

		const dropzone = screen.getByText("dropzoneTitle").parentElement;
		if (dropzone) {
			fireEvent.click(dropzone);
			expect(clickSpy).toHaveBeenCalled();
		}
	});

	it("powinien zamykać szufladę po naciśnięciu Escape gdy nie trwa upload", () => {
		const onClose = vi.fn();
		render(
			<UploaderDrawer
				gallerySlug="kasia-i-tomek"
				isOpen={true}
				onClose={onClose}
			/>,
		);

		fireEvent.keyDown(window, { key: "Escape" });
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("nie powinien zamykać szuflady po naciśnięciu Escape gdy trwa upload", () => {
		const onClose = vi.fn();
		const { container } = render(
			<UploaderDrawer
				gallerySlug="kasia-i-tomek"
				isOpen={true}
				onClose={onClose}
			/>,
		);

		const file = new File(["video"], "test.mp4", { type: "video/mp4" });
		const fileInput = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		fireEvent.change(fileInput, { target: { files: [file] } });

		const uploadBtn = screen.getByRole("button", {
			name: "submitBtn",
		});
		fireEvent.click(uploadBtn);

		fireEvent.keyDown(window, { key: "Escape" });
		expect(onClose).not.toHaveBeenCalled();
	});
});
