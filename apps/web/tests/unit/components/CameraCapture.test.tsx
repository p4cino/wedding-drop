// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CameraCapture from "@/components/CameraCapture";

const captureFrameToCanvasMock = vi.fn();
const canvasToJpegFileMock = vi.fn();

vi.mock("@/lib/photobooth", () => ({
	captureFrameToCanvas: (...args: unknown[]) =>
		captureFrameToCanvasMock(...args),
	canvasToJpegFile: (...args: unknown[]) => canvasToJpegFileMock(...args),
}));

function mockGetUserMedia(
	impl: () => Promise<MediaStream>,
): ReturnType<typeof vi.fn> {
	const fn = vi.fn(impl);
	Object.defineProperty(navigator, "mediaDevices", {
		configurable: true,
		value: { getUserMedia: fn },
	});
	return fn;
}

function fakeStream(): MediaStream {
	const track = { stop: vi.fn() };
	return {
		getTracks: () => [track],
	} as unknown as MediaStream;
}

describe("CameraCapture Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		captureFrameToCanvasMock.mockReturnValue({ width: 640, height: 480 });
		canvasToJpegFileMock.mockResolvedValue(
			new File(["dane"], "photobooth_1.jpg", { type: "image/jpeg" }),
		);
		// HTMLMediaElement.play nie jest zaimplementowane w jsdom
		HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
	});

	it("pokazuje stan uruchamiania, a następnie podgląd na żywo po udzielonym dostępie do kamery", async () => {
		mockGetUserMedia(async () => fakeStream());

		render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

		expect(screen.getByText("cameraStarting")).toBeInTheDocument();

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: "cameraShutter" }),
			).toBeEnabled();
		});
	});

	it("pokazuje czytelny komunikat błędu, gdy przeglądarka odmówi dostępu do kamery", async () => {
		mockGetUserMedia(async () => {
			throw new DOMException("Odmowa dostępu", "NotAllowedError");
		});
		const onCancel = vi.fn();

		render(<CameraCapture onCapture={vi.fn()} onCancel={onCancel} />);

		await waitFor(() => {
			expect(screen.getByText("cameraError")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText("cameraBackToFiles"));
		expect(onCancel).toHaveBeenCalled();
	});

	it("pokazuje komunikat błędu, gdy przeglądarka nie posiada API getUserMedia", async () => {
		Object.defineProperty(navigator, "mediaDevices", {
			configurable: true,
			value: undefined,
		});

		render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

		await waitFor(() => {
			expect(screen.getByText("cameraError")).toBeInTheDocument();
		});
	});

	it("po kliknięciu spustu migawki komponuje klatkę na canvasie i przekazuje wynikowy plik", async () => {
		mockGetUserMedia(async () => fakeStream());
		const onCapture = vi.fn();

		render(
			<CameraCapture
				primaryColor="#112233"
				accentColor="#AABBCC"
				onCapture={onCapture}
				onCancel={vi.fn()}
			/>,
		);

		const shutterBtn = await screen.findByRole("button", {
			name: "cameraShutter",
		});
		await waitFor(() => expect(shutterBtn).toBeEnabled());

		fireEvent.click(shutterBtn);

		await waitFor(() => {
			expect(onCapture).toHaveBeenCalledTimes(1);
		});

		expect(captureFrameToCanvasMock).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			{ primaryColor: "#112233", accentColor: "#AABBCC" },
		);
		const [capturedFile] = onCapture.mock.calls[0];
		expect(capturedFile).toBeInstanceOf(File);
		expect(capturedFile.type).toBe("image/jpeg");
	});

	it("wywołuje onCancel po kliknięciu przycisku zamknięcia podglądu", async () => {
		mockGetUserMedia(async () => fakeStream());
		const onCancel = vi.fn();

		render(<CameraCapture onCapture={vi.fn()} onCancel={onCancel} />);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: "cameraShutter" }),
			).toBeEnabled();
		});

		fireEvent.click(screen.getByLabelText("cameraCancel"));
		expect(onCancel).toHaveBeenCalled();
	});

	it("zatrzymuje ścieżki strumienia kamery po odmontowaniu komponentu", async () => {
		const stream = fakeStream();
		mockGetUserMedia(async () => stream);

		const { unmount } = render(
			<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />,
		);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: "cameraShutter" }),
			).toBeEnabled();
		});

		unmount();

		const [track] = stream.getTracks();
		expect(track.stop).toHaveBeenCalled();
	});
});
