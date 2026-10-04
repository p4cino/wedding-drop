// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UploaderDrawer from "@/components/UploaderDrawer";
import { tusMock } from "../../helpers/tus-mock";

vi.mock("tus-js-client", async () =>
	(await import("../../helpers/tus-mock")).createTusMock(),
);

describe("UploaderDrawer Component", () => {
	beforeEach(() => {
		tusMock.reset();
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

		// Po pełnym sukcesie kolejka jest pusta od razu
		expect(screen.queryByText("taniec.mp4")).toBeNull();
		expect(screen.getByText("allUploaded")).toBeInTheDocument();

		const doneBtn = screen.getByRole("button", {
			name: "doneBtn",
		});
		fireEvent.click(doneBtn);
		expect(onClose).toHaveBeenCalled();
	});

	it("powinien czyścić listę po zamknięciu i ponownym otwarciu", () => {
		const onClose = vi.fn();
		const { container, rerender } = render(
			<UploaderDrawer
				gallerySlug="kasia-i-tomek"
				isOpen={true}
				onClose={onClose}
			/>,
		);

		const file = new File(["photo"], "zostan.jpg", { type: "image/jpeg" });
		const fileInput = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		fireEvent.change(fileInput, { target: { files: [file] } });
		expect(screen.getByText("zostan.jpg")).toBeInTheDocument();

		fireEvent.click(screen.getByLabelText("drawerCloseTitle"));
		expect(onClose).toHaveBeenCalled();

		rerender(
			<UploaderDrawer
				gallerySlug="kasia-i-tomek"
				isOpen={false}
				onClose={onClose}
			/>,
		);
		rerender(
			<UploaderDrawer
				gallerySlug="kasia-i-tomek"
				isOpen={true}
				onClose={onClose}
			/>,
		);

		expect(screen.queryByText("zostan.jpg")).toBeNull();
	});

	it("przy częściowym błędzie zostawia pliki z error i usuwa completed", async () => {
		tusMock.failNames = new Set(["fail.jpg"]);
		const { container } = render(
			<UploaderDrawer
				gallerySlug="kasia-i-tomek"
				isOpen={true}
				onClose={vi.fn()}
			/>,
		);

		const ok = new File(["ok"], "ok.jpg", { type: "image/jpeg" });
		const bad = new File(["bad"], "fail.jpg", { type: "image/jpeg" });
		const fileInput = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		fireEvent.change(fileInput, { target: { files: [ok, bad] } });

		fireEvent.click(screen.getByRole("button", { name: "submitBtn" }));

		await waitFor(() => {
			expect(container.querySelector(".c_red\\.500")).toBeInTheDocument();
		});

		expect(screen.queryByText("ok.jpg")).toBeNull();
		expect(screen.getByText("fail.jpg")).toBeInTheDocument();
		expect(screen.queryByText("doneBtn")).toBeNull();
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
		const deleteBtn = screen.getByTestId("remove-file-btn");
		expect(deleteBtn).toBeInTheDocument();
		if (deleteBtn) {
			fireEvent.click(deleteBtn);
		}

		expect(screen.queryByText("foto.jpg")).toBeNull();
	});

	it("powinien obsłużyć błąd uploadu dla pliku", async () => {
		tusMock.failAll = true;
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
			expect(container.querySelector(".c_red\\.500")).toBeInTheDocument();
		});

		// Sam błąd — pozycja zostaje na liście (brak pełnego wyczyszczenia)
		expect(screen.getByText("problem.jpg")).toBeInTheDocument();
		// Komunikat błędu jest widoczny przy pliku (wcześniej trafiał tylko do stanu)
		expect(screen.getByText("uploadError")).toBeInTheDocument();
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

	it("nie powinien zamykać szuflady po naciśnięciu Escape gdy trwa upload", async () => {
		tusMock.defer = true;
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

		await waitFor(() => {
			expect(screen.getByText("uploadingBtn")).toBeInTheDocument();
		});

		fireEvent.keyDown(window, { key: "Escape" });
		expect(onClose).not.toHaveBeenCalled();

		tusMock.pendingFinish?.();
		await waitFor(() => {
			expect(screen.getByText("doneBtn")).toBeInTheDocument();
		});
	});

	it("powinien dodać zdjęcie zrobione natywnym aparatem (przez hidden input) do wspólnej kolejki uploadu", async () => {
		const { container } = render(
			<UploaderDrawer
				gallerySlug="kasia-i-tomek"
				isOpen={true}
				onClose={vi.fn()}
			/>,
		);

		// Przycisk natywnego aparatu powinien być widoczny
		const cameraBtn = screen.getByRole("button", { name: "cameraOptionBtn" });
		expect(cameraBtn).toBeInTheDocument();

		// Input ukryty obok przycisku
		const fileInput = container.querySelector(
			"input#native-camera-input",
		) as HTMLInputElement;
		expect(fileInput).not.toBeNull();
		expect(fileInput.getAttribute("capture")).toBe("environment");

		// Symulacja wyboru zdjęcia z aparatu
		const file = new File(["photo"], "zdjecie_z_aparatu.jpg", {
			type: "image/jpeg",
		});
		fireEvent.change(fileInput, { target: { files: [file] } });

		// Zdjęcie z aparatu na wspólnej liście
		expect(screen.getByText("zdjecie_z_aparatu.jpg")).toBeInTheDocument();

		// Zdjęcie z aparatu trafia do tej samej kolejki wysyłki
		const uploadBtn = screen.getByRole("button", { name: "submitBtn" });
		fireEvent.click(uploadBtn);

		await waitFor(() => {
			expect(screen.getByText("doneBtn")).toBeInTheDocument();
		});
	});

	it("trzyma fokus wewnątrz okna (Tab zapętla się) i przywraca go po zamknięciu", () => {
		const opener = document.createElement("button");
		document.body.appendChild(opener);
		opener.focus();

		const { rerender } = render(
			<UploaderDrawer gallerySlug="kasia" isOpen={true} onClose={vi.fn()} />,
		);
		const dialog = screen.getByRole("dialog");
		const focusables = dialog.querySelectorAll<HTMLElement>(
			"button:not([disabled]), input:not([disabled])",
		);
		expect(dialog.contains(document.activeElement)).toBe(true);

		const last = focusables[focusables.length - 1];
		last.focus();
		fireEvent.keyDown(window, { key: "Tab" });
		expect(document.activeElement).toBe(focusables[0]);

		rerender(
			<UploaderDrawer gallerySlug="kasia" isOpen={false} onClose={vi.fn()} />,
		);
		expect(document.activeElement).toBe(opener);
		opener.remove();
	});
});
