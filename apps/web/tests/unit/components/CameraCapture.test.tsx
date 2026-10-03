// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CameraCapture from "@/components/CameraCapture";
import {
	createFakeStream,
	removeMediaDevices,
	stubMediaDevices,
} from "../../helpers/media-devices";

const captureFrameToCanvasMock = vi.fn();
const captureSourceToCanvasMock = vi.fn();
const canvasToJpegFileMock = vi.fn();

vi.mock("@/lib/photobooth", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/photobooth")>()),
	captureFrameToCanvas: (...args: unknown[]) =>
		captureFrameToCanvasMock(...args),
	captureSourceToCanvas: (...args: unknown[]) =>
		captureSourceToCanvasMock(...args),
	canvasToJpegFile: (...args: unknown[]) => canvasToJpegFileMock(...args),
}));

const mockGetUserMedia = stubMediaDevices;
const fakeStream = () => createFakeStream().stream;

describe("CameraCapture Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		captureFrameToCanvasMock.mockReturnValue({ width: 640, height: 480 });
		captureSourceToCanvasMock.mockReturnValue({ width: 1920, height: 1080 });
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
		removeMediaDevices();

		render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

		await waitFor(() => {
			expect(screen.getByText("cameraError")).toBeInTheDocument();
		});
	});

	it("po kliknięciu spustu migawki komponuje klatkę na canvasie i przekazuje wynikowy plik z jakością 0.95", async () => {
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
		expect(canvasToJpegFileMock).toHaveBeenCalledWith(
			expect.anything(),
			expect.stringMatching(/^photobooth_\d+\.jpg$/),
			0.95,
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

	it("po błędzie zrobienia zdjęcia od razu zatrzymuje strumień kamery (bez czekania na odmontowanie)", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		captureFrameToCanvasMock.mockImplementation(() => {
			throw new Error("canvas");
		});
		const { stream, track } = createFakeStream();
		mockGetUserMedia(async () => stream);

		render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);
		const shutter = await screen.findByRole("button", {
			name: "cameraShutter",
		});
		await waitFor(() => expect(shutter).toBeEnabled());

		fireEvent.click(shutter);
		expect(await screen.findByText("cameraError")).toBeInTheDocument();
		expect(track.stop).toHaveBeenCalled();
	});

	it("domyślnie uruchamia tylną kamerę (environment) z elastycznym ograniczeniem ideal oraz Full HD", async () => {
		const gum = mockGetUserMedia(async () => fakeStream());

		render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

		await waitFor(() => {
			expect(gum).toHaveBeenCalledWith({
				video: {
					facingMode: { ideal: "environment" },
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
				audio: false,
			});
		});

		const video = screen.getByTestId("camera-preview-video");
		expect(video.className).not.toContain("scale-x-[-1]");
	});

	it("automatycznie włącza ciągły autofokus (focusMode: continuous) jeśli ścieżka wideo go wspiera", async () => {
		const { stream, track } = createFakeStream();
		mockGetUserMedia(async () => stream);

		render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

		await waitFor(() => {
			expect(track.applyConstraints).toHaveBeenCalledWith({
				advanced: [{ focusMode: "continuous" }],
			});
		});
	});

	it("wyświetla przycisk przełączenia aparatu, gdy urządzenie posiada więcej niż jedną kamerę", async () => {
		mockGetUserMedia(
			async () => fakeStream(),
			[
				{ deviceId: "cam1", kind: "videoinput" } as MediaDeviceInfo,
				{ deviceId: "cam2", kind: "videoinput" } as MediaDeviceInfo,
			],
		);

		render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

		const switchBtn = await screen.findByRole("button", {
			name: "cameraSwitchCamera",
		});
		expect(switchBtn).toBeInTheDocument();
		await waitFor(() => expect(switchBtn).toBeEnabled());
	});

	it("nie wyświetla przycisku przełączenia aparatu, gdy dostępne jest tylko jedno urządzenie wideo", async () => {
		mockGetUserMedia(
			async () => fakeStream(),
			[{ deviceId: "cam1", kind: "videoinput" } as MediaDeviceInfo],
		);

		render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

		await screen.findByRole("button", { name: "cameraShutter" });
		expect(
			screen.queryByRole("button", { name: "cameraSwitchCamera" }),
		).not.toBeInTheDocument();
	});

	it("po kliknięciu przycisku przełączenia zmienia kamerę na przednią (user), zatrzymuje stary strumień i dodaje klasę lustrzaną", async () => {
		const { stream: firstStream, track: firstTrack } = createFakeStream();
		const { stream: secondStream } = createFakeStream();
		let callCount = 0;
		const gum = mockGetUserMedia(async () => {
			callCount++;
			return callCount === 1 ? firstStream : secondStream;
		});

		render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

		const switchBtn = await screen.findByRole("button", {
			name: "cameraSwitchCamera",
		});
		await waitFor(() => expect(switchBtn).toBeEnabled());

		fireEvent.click(switchBtn);

		await waitFor(() => {
			expect(firstTrack.stop).toHaveBeenCalled();
			expect(gum).toHaveBeenLastCalledWith({
				video: {
					facingMode: { ideal: "user" },
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
				audio: false,
			});
		});

		const video = screen.getByTestId("camera-preview-video");
		expect(video.className).toContain("scale-x-[-1]");
		expect(localStorage.getItem("wedding_drop_camera_facing")).toBe("user");
	});

	it("wczytuje zapamiętaną preferencję kamery z localStorage", async () => {
		localStorage.setItem("wedding_drop_camera_facing", "user");
		const gum = mockGetUserMedia(async () => fakeStream());

		render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

		await waitFor(() => {
			expect(gum).toHaveBeenCalledWith({
				video: {
					facingMode: { ideal: "user" },
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
				audio: false,
			});
		});

		const video = screen.getByTestId("camera-preview-video");
		expect(video.className).toContain("scale-x-[-1]");
	});

	it("wykorzystuje ImageCapture i captureSourceToCanvas, gdy API jest dostępne w przeglądarce", async () => {
		const { stream } = createFakeStream();
		mockGetUserMedia(async () => stream);
		const onCapture = vi.fn();

		const fakeBlob = new Blob(["foto"], { type: "image/jpeg" });
		const takePhotoMock = vi.fn().mockResolvedValue(fakeBlob);
		class MockImageCapture {
			takePhoto = takePhotoMock;
		}
		(window as unknown as Record<string, unknown>).ImageCapture =
			MockImageCapture;
		window.createImageBitmap = vi.fn().mockResolvedValue({
			width: 3840,
			height: 2160,
			close: vi.fn(),
		});

		render(<CameraCapture onCapture={onCapture} onCancel={vi.fn()} />);
		const shutterBtn = await screen.findByRole("button", {
			name: "cameraShutter",
		});
		await waitFor(() => expect(shutterBtn).toBeEnabled());

		fireEvent.click(shutterBtn);

		await waitFor(() => {
			expect(onCapture).toHaveBeenCalledTimes(1);
		});

		expect(takePhotoMock).toHaveBeenCalled();
		expect(captureSourceToCanvasMock).toHaveBeenCalledWith(
			expect.anything(),
			3840,
			2160,
			expect.anything(),
			expect.anything(),
		);

		// Cleanup
		delete (window as unknown as Record<string, unknown>).ImageCapture;
		delete (window as unknown as Record<string, unknown>).createImageBitmap;
	});
});
