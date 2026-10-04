// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AudioVideoRecorder from "@/components/upload/AudioVideoRecorder";
import {
	createFakeStream,
	removeMediaDevices,
	stubMediaDevices,
} from "../../helpers/media-devices";

class FakeRecorder {
	static instances: FakeRecorder[] = [];
	static isTypeSupported = (m: string) => m.includes("webm");
	state = "inactive";
	mimeType: string;
	ondataavailable: ((e: { data: Blob }) => void) | null = null;
	onstop: (() => void) | null = null;
	constructor(
		public stream: MediaStream,
		opts?: { mimeType?: string },
	) {
		this.mimeType = opts?.mimeType ?? "";
		FakeRecorder.instances.push(this);
	}
	start() {
		this.state = "recording";
	}
	stop() {
		this.state = "inactive";
		this.ondataavailable?.({ data: new Blob(["x"], { type: this.mimeType }) });
		this.onstop?.();
	}
}

describe("AudioVideoRecorder", () => {
	beforeEach(() => {
		FakeRecorder.instances = [];
		vi.stubGlobal("MediaRecorder", FakeRecorder);
		URL.createObjectURL = vi.fn(() => "blob:preview");
		URL.revokeObjectURL = vi.fn();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("nagrywa audio, pokazuje podgląd i oddaje plik w faktycznym formacie", async () => {
		const { stream, track } = createFakeStream();
		const getUserMedia = stubMediaDevices(() => Promise.resolve(stream));
		const onRecorded = vi.fn();
		render(<AudioVideoRecorder onRecorded={onRecorded} />);

		fireEvent.click(await screen.findByText("recorderRecordAudio"));
		await screen.findByLabelText("recorderStop");
		expect(getUserMedia).toHaveBeenCalledWith({ audio: true });

		fireEvent.click(screen.getByLabelText("recorderStop"));
		await screen.findByText("recorderPreviewAudio");
		expect(track.stop).toHaveBeenCalled();

		fireEvent.click(screen.getByText("recorderSend"));
		expect(onRecorded).toHaveBeenCalledTimes(1);
		const file = onRecorded.mock.calls[0][0] as File;
		expect(file.type).toBe("audio/webm");
		expect(file.name).toMatch(/^zyczenia_\d+\.webm$/);
	});

	it("nagrywa wideo z domyślnie przednią kamerą", async () => {
		const getUserMedia = stubMediaDevices();
		render(<AudioVideoRecorder onRecorded={vi.fn()} />);

		fireEvent.click(await screen.findByText("recorderRecordVideo"));
		await screen.findByLabelText("recorderStop");
		expect(getUserMedia).toHaveBeenCalledWith(
			expect.objectContaining({
				video: expect.objectContaining({ facingMode: "user" }),
			}),
		);
	});

	it("przełącza kamerę na tylną przed nagraniem", async () => {
		const getUserMedia = stubMediaDevices();
		render(<AudioVideoRecorder onRecorded={vi.fn()} />);

		fireEvent.click(await screen.findByLabelText("cameraSwitchCamera"));
		fireEvent.click(screen.getByText("recorderRecordVideo"));
		await screen.findByLabelText("recorderStop");
		expect(getUserMedia).toHaveBeenCalledWith(
			expect.objectContaining({
				video: expect.objectContaining({ facingMode: "environment" }),
			}),
		);
	});

	it("po 'nagraj ponownie' wraca do wyboru i zwalnia adres podglądu", async () => {
		stubMediaDevices();
		render(<AudioVideoRecorder onRecorded={vi.fn()} />);

		fireEvent.click(await screen.findByText("recorderRecordAudio"));
		fireEvent.click(await screen.findByLabelText("recorderStop"));
		fireEvent.click(await screen.findByText("recorderRetake"));

		expect(await screen.findByText("recorderRecordAudio")).toBeInTheDocument();
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
	});

	it("automatycznie kończy nagrywanie po limicie czasu", async () => {
		stubMediaDevices();
		render(<AudioVideoRecorder onRecorded={vi.fn()} maxDurationSeconds={1} />);

		fireEvent.click(await screen.findByText("recorderRecordAudio"));
		await screen.findByLabelText("recorderStop");
		await waitFor(
			() =>
				expect(screen.getByText("recorderPreviewAudio")).toBeInTheDocument(),
			{ timeout: 3000 },
		);
	});

	it("pokazuje komunikat (i18n) przy odmowie dostępu do urządzeń", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		stubMediaDevices(() => Promise.reject(new Error("denied")));
		render(<AudioVideoRecorder onRecorded={vi.fn()} />);

		fireEvent.click(await screen.findByText("recorderRecordAudio"));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"recorderPermissionError",
		);
	});

	it("bez MediaRecorder/mediaDevices pokazuje fallback na natywny wybór pliku", async () => {
		removeMediaDevices();
		vi.unstubAllGlobals();
		const onRecorded = vi.fn();
		const { container } = render(
			<AudioVideoRecorder onRecorded={onRecorded} />,
		);

		expect(
			await screen.findByText("recorderFallbackAudio"),
		).toBeInTheDocument();
		const input = container.querySelector(
			'input[type="file"][accept="video/*"]',
		) as HTMLInputElement;
		expect(input).toHaveAttribute("capture");

		const file = new File(["v"], "z.mp4", { type: "video/mp4" });
		fireEvent.change(input, { target: { files: [file] } });
		expect(onRecorded).toHaveBeenCalledWith(file);
	});
});
