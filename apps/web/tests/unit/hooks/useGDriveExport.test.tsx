// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGDriveExport } from "@/hooks/useGDriveExport";
import type { OwnerPanelData } from "@/lib/owner-types";

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status });

const panelData: OwnerPanelData = {
	success: true,
	gallery: {
		id: "1",
		slug: "s",
		hasGDrive: true,
		gdriveAccountEmail: "a@b.pl",
		gdriveExportStatus: "idle",
	},
	stats: { totalFiles: 0, totalBytes: 0 },
};

describe("useGDriveExport", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it("loadFromPanel ustawia cały stan naraz", () => {
		const { result } = renderHook(() => useGDriveExport("s", "tok"));
		act(() => result.current.loadFromPanel(panelData));
		expect(result.current.state).toMatchObject({
			connected: true,
			email: "a@b.pl",
			status: "idle",
		});
	});

	it("applySseProgress aktualizuje status, postęp i folder w jednej zmianie stanu", () => {
		const { result } = renderHook(() => useGDriveExport("s", "tok"));
		let renders = 0;
		const { result: counted } = renderHook(() => {
			renders++;
			return useGDriveExport("s", "tok");
		});
		renders = 0;
		act(() =>
			counted.current.applySseProgress({
				processedFiles: 2,
				status: "running",
				rootFolderId: "f1",
			}),
		);
		expect(renders).toBe(1);
		expect(counted.current.state).toMatchObject({
			status: "running",
			folderId: "f1",
			progress: { processedFiles: 2 },
		});
		expect(result.current.state.status).toBe("idle");
	});

	it("gdy eksport trwa, odpytuje status co 3 s z tokenem i scala odpowiedź", async () => {
		vi.useFakeTimers();
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				json({ gdriveExportStatus: "completed", gdriveRootFolderId: "f9" }),
			);
		vi.stubGlobal("fetch", fetchMock);
		const { result } = renderHook(() => useGDriveExport("s", "tok"));
		act(() => result.current.applySseProgress({ status: "running" }));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(3000);
		});
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0][0]).toBe("/api/owner/s/gdrive");
		expect(fetchMock.mock.calls[0][1].headers["x-owner-token"]).toBe("tok");
		expect(result.current.state).toMatchObject({
			status: "completed",
			folderId: "f9",
		});

		// Po zakończeniu polling się zatrzymuje
		await act(async () => {
			await vi.advanceTimersByTimeAsync(9000);
		});
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("nie odpytuje bez tokenu ani gdy eksport nie trwa", async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const { result } = renderHook(() => useGDriveExport("s", ""));
		act(() => result.current.applySseProgress({ status: "running" }));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(10000);
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("disconnect czyści połączenie po sukcesie i nic nie zmienia po błędzie", async () => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValueOnce(json({}, 500))
				.mockResolvedValueOnce(json({})),
		);
		const { result } = renderHook(() => useGDriveExport("s", "tok"));
		act(() => result.current.loadFromPanel(panelData));

		let ok = true;
		await act(async () => {
			ok = await result.current.disconnect();
		});
		expect(ok).toBe(false);
		expect(result.current.state.connected).toBe(true);

		await act(async () => {
			ok = await result.current.disconnect();
		});
		expect(ok).toBe(true);
		expect(result.current.state).toMatchObject({
			connected: false,
			email: null,
		});
	});

	it("startExport: sukces ustawia 'running', błąd API zwraca komunikat, błąd sieci flagę network", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValueOnce(json({ success: true }))
				.mockResolvedValueOnce(json({ error: "Już trwa" }, 409))
				.mockRejectedValueOnce(new Error("offline")),
		);
		const { result } = renderHook(() => useGDriveExport("s", "tok"));

		await act(async () => {
			expect(await result.current.startExport(true)).toEqual({ ok: true });
		});
		await waitFor(() => expect(result.current.state.status).toBe("running"));

		await act(async () => {
			expect(await result.current.startExport(false)).toEqual({
				ok: false,
				network: false,
				message: "Już trwa",
			});
		});
		await act(async () => {
			expect(await result.current.startExport(false)).toEqual({
				ok: false,
				network: true,
			});
		});
	});
});
