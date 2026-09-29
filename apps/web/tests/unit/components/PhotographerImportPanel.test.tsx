// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PhotographerImportPanel } from "@/components/owner/PhotographerImportPanel";

let failFileNames = new Set<string>();
let capturedMetadata: Record<string, string>[] = [];

interface TusMockOptions {
	metadata: Record<string, string>;
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
			capturedMetadata.push(this.options.metadata);
			if (failFileNames.has(this.options.metadata.originalName)) {
				this.options.onError(new Error("Błąd sieci"));
				return;
			}
			this.options.onProgress(50, 100);
			this.options.onSuccess();
		}
	}
	return { Upload: MockUpload };
});

function selectFiles(container: HTMLElement, files: File[]) {
	const input = container.querySelector(
		'input[type="file"]',
	) as HTMLInputElement;
	fireEvent.change(input, { target: { files } });
}

const photo = () => new File(["a"], "foto.jpg", { type: "image/jpeg" });
const video = () => new File(["b"], "film.mp4", { type: "video/mp4" });

describe("PhotographerImportPanel Component", () => {
	beforeEach(() => {
		failFileNames = new Set();
		capturedMetadata = [];
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("nie pokazuje listy plików ani przycisku importu, dopóki nic nie wybrano", () => {
		render(<PhotographerImportPanel gallerySlug="s" ownerToken="tok" />);
		expect(screen.getByText("importTitle")).toBeInTheDocument();
		expect(screen.queryByText(/importSubmitBtn/)).not.toBeInTheDocument();
	});

	it("ignoruje zdarzenie zmiany pola pliku bez wybranych plików", () => {
		const { container } = render(
			<PhotographerImportPanel gallerySlug="s" ownerToken="tok" />,
		);
		selectFiles(container, []);
		expect(screen.queryByText(/importSelectedCount/)).not.toBeInTheDocument();
	});

	it("dodaje wybrane pliki do listy i pozwala usunąć pojedynczy oraz wyczyścić całą listę", () => {
		const { container } = render(
			<PhotographerImportPanel gallerySlug="s" ownerToken="tok" />,
		);
		selectFiles(container, [photo(), video()]);
		expect(screen.getByText("foto.jpg")).toBeInTheDocument();
		expect(screen.getByText("film.mp4")).toBeInTheDocument();

		fireEvent.click(
			screen.getAllByRole("button", { name: /importRemoveFileTitle/ })[0],
		);
		expect(screen.getAllByRole("progressbar").length).toBe(1);

		fireEvent.click(screen.getByText("importClearAll"));
		expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
	});

	it("importuje pliki po kolei z metadanymi source=photographer i tokenem właściciela", async () => {
		const onImportSuccess = vi.fn();
		const { container } = render(
			<PhotographerImportPanel
				gallerySlug="kasia-i-tomek"
				ownerToken="owner-tok"
				onImportSuccess={onImportSuccess}
			/>,
		);
		selectFiles(container, [photo(), video()]);
		fireEvent.click(screen.getByRole("button", { name: /importSubmitBtn/ }));

		await waitFor(() => expect(onImportSuccess).toHaveBeenCalledTimes(1));
		expect(capturedMetadata).toHaveLength(2);
		for (const meta of capturedMetadata) {
			expect(meta.gallerySlug).toBe("kasia-i-tomek");
			expect(meta.source).toBe("photographer");
			expect(meta.ownerToken).toBe("owner-tok");
		}
		expect(screen.getByText(/importAllUploaded/)).toBeInTheDocument();
		for (const bar of screen.getAllByRole("progressbar")) {
			expect(bar).toHaveAttribute("aria-valuenow", "100");
		}
	});

	it("oznacza plik jako błędny, ale kontynuuje import pozostałych", async () => {
		failFileNames = new Set(["foto.jpg"]);
		const onImportSuccess = vi.fn();
		const { container } = render(
			<PhotographerImportPanel
				gallerySlug="s"
				ownerToken="tok"
				onImportSuccess={onImportSuccess}
			/>,
		);
		selectFiles(container, [photo(), video()]);
		fireEvent.click(screen.getByRole("button", { name: /importSubmitBtn/ }));

		await waitFor(() => expect(onImportSuccess).toHaveBeenCalled());
		expect(screen.getByText("importError")).toBeInTheDocument();
		expect(capturedMetadata).toHaveLength(2);
	});

	it("nie uruchamia importu bez tokenu właściciela", () => {
		const { container } = render(
			<PhotographerImportPanel gallerySlug="s" ownerToken="" />,
		);
		selectFiles(container, [photo()]);
		const submit = screen.getByRole("button", { name: /importSubmitBtn/ });
		expect(submit).toBeDisabled();
		fireEvent.click(submit);
		expect(capturedMetadata).toHaveLength(0);
	});

	it("pomija już zaimportowane pliki przy ponownym uruchomieniu importu", async () => {
		failFileNames = new Set(["foto.jpg"]);
		const { container } = render(
			<PhotographerImportPanel gallerySlug="s" ownerToken="tok" />,
		);
		selectFiles(container, [photo(), video()]);
		fireEvent.click(screen.getByRole("button", { name: /importSubmitBtn/ }));
		await waitFor(() => expect(capturedMetadata).toHaveLength(2));
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: /importSubmitBtn/ }),
			).toBeEnabled(),
		);

		failFileNames = new Set();
		capturedMetadata = [];
		fireEvent.click(screen.getByRole("button", { name: /importSubmitBtn/ }));
		await waitFor(() => expect(capturedMetadata).toHaveLength(1));
		expect(capturedMetadata[0].originalName).toBe("foto.jpg");
	});
});
