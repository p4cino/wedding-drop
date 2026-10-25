// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModerationSettingsPanel } from "../../../src/components/owner/ModerationSettingsPanel";

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));

describe("ModerationSettingsPanel", () => {
	const defaultSettings = {
		allowGuestUploads: true,
		allowGuestViewing: true,
		isApprovalQueueEnabled: false,
	};

	it("renders with default settings", () => {
		render(
			<ModerationSettingsPanel
				settings={defaultSettings}
				onSave={vi.fn().mockResolvedValue(true)}
			/>,
		);

		expect(screen.getByText("moderationSettingsTitle")).toBeInTheDocument();

		const checkboxes = screen.getAllByRole("checkbox");
		expect(checkboxes).toHaveLength(4);
		expect(checkboxes[0]).toBeChecked(); // allowGuestUploads
		expect(checkboxes[1]).toBeChecked(); // allowGuestViewing
		expect(checkboxes[2]).not.toBeChecked(); // isApprovalQueueEnabled
		expect(checkboxes[3]).not.toBeChecked(); // clearGuestPassword
	});

	it("calls onSave with updated settings", async () => {
		const onSaveMock = vi.fn().mockResolvedValue(true);

		render(
			<ModerationSettingsPanel
				settings={defaultSettings}
				onSave={onSaveMock}
			/>,
		);

		const checkboxes = screen.getAllByRole("checkbox");

		// Toggle first checkbox
		fireEvent.click(checkboxes[0]);

		const submitButton = screen.getByRole("button", { name: "saveSettings" });

		await act(async () => {
			fireEvent.click(submitButton);
		});

		expect(onSaveMock).toHaveBeenCalledWith({
			allowGuestUploads: false,
			allowGuestViewing: true,
			isApprovalQueueEnabled: false,
			guestPassword: undefined,
		});
	});

	it("includes guest password if provided", async () => {
		const onSaveMock = vi.fn().mockResolvedValue(true);

		render(
			<ModerationSettingsPanel
				settings={defaultSettings}
				onSave={onSaveMock}
			/>,
		);

		const passwordInput = screen.getByLabelText("guestPasswordLabel");
		fireEvent.change(passwordInput, { target: { value: "secret123" } });

		const submitButton = screen.getByRole("button", { name: "saveSettings" });

		await act(async () => {
			fireEvent.click(submitButton);
		});

		expect(onSaveMock).toHaveBeenCalledWith({
			allowGuestUploads: true,
			allowGuestViewing: true,
			isApprovalQueueEnabled: false,
			guestPassword: "secret123",
		});
	});

	it("sends guestPassword: null when clearGuestPassword checkbox is checked", async () => {
		const onSaveMock = vi.fn().mockResolvedValue(true);

		render(
			<ModerationSettingsPanel
				settings={defaultSettings}
				onSave={onSaveMock}
			/>,
		);

		const checkboxes = screen.getAllByRole("checkbox");
		fireEvent.click(checkboxes[3]);

		const submitButton = screen.getByRole("button", { name: "saveSettings" });

		await act(async () => {
			fireEvent.click(submitButton);
		});

		expect(onSaveMock).toHaveBeenCalledWith({
			allowGuestUploads: true,
			allowGuestViewing: true,
			isApprovalQueueEnabled: false,
			guestPassword: null,
		});
	});
});
