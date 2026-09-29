// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUploadQueue } from "@/hooks/useUploadQueue";
import { tusMock } from "../../helpers/tus-mock";

vi.mock("tus-js-client", async () =>
	(await import("../../helpers/tus-mock")).createTusMock(),
);

const f = (name: string) => new File(["x"], name, { type: "image/jpeg" });
const meta = (file: File) => ({ originalName: file.name });

describe("useUploadQueue", () => {
	beforeEach(() => {
		tusMock.reset();
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("dodaje i usuwa pliki oraz czyści kolejkę", () => {
		const { result } = renderHook(() =>
			useUploadQueue({ errorMessage: "err" }),
		);
		act(() => result.current.addFiles([f("a.jpg"), f("b.jpg")]));
		expect(result.current.items).toHaveLength(2);
		act(() => result.current.remove(result.current.items[0].id));
		expect(result.current.items).toHaveLength(1);
		act(() => result.current.clear());
		expect(result.current.items).toEqual([]);
	});

	it("start bez plików nic nie robi", async () => {
		const onFinished = vi.fn();
		const { result } = renderHook(() =>
			useUploadQueue({ errorMessage: "err", onFinished }),
		);
		await act(async () => result.current.start(meta));
		expect(onFinished).not.toHaveBeenCalled();
		expect(result.current.phase).toBe("idle");
	});

	it("pełny sukces: faza 'done', kolejka wyczyszczona, callback z liczbami", async () => {
		const onFinished = vi.fn();
		const { result } = renderHook(() =>
			useUploadQueue({ errorMessage: "err", onFinished }),
		);
		act(() => result.current.addFiles([f("a.jpg"), f("b.jpg")]));
		await act(async () => result.current.start(meta));
		expect(result.current.phase).toBe("done");
		expect(result.current.items).toEqual([]);
		expect(result.current.completedCount).toBe(2);
		expect(onFinished).toHaveBeenCalledWith({ completed: 2, failed: 0 });
	});

	it("całkowita porażka: brak callbacku, faza 'idle', pliki zostają z błędem", async () => {
		tusMock.failAll = true;
		const onFinished = vi.fn();
		const { result } = renderHook(() =>
			useUploadQueue({ errorMessage: "błąd!", onFinished }),
		);
		act(() => result.current.addFiles([f("a.jpg")]));
		await act(async () => result.current.start(meta));
		expect(onFinished).not.toHaveBeenCalled();
		expect(result.current.phase).toBe("idle");
		expect(result.current.items).toHaveLength(1);
		expect(result.current.items[0]).toMatchObject({
			status: "error",
			error: "błąd!",
		});
	});

	it("sukces częściowy: udane znikają, nieudane zostają, callback raz; ponowna próba wysyła tylko nieudane", async () => {
		tusMock.failNames = new Set(["bad.jpg"]);
		const onFinished = vi.fn();
		const { result } = renderHook(() =>
			useUploadQueue({ errorMessage: "err", onFinished }),
		);
		act(() => result.current.addFiles([f("ok.jpg"), f("bad.jpg")]));
		await act(async () => result.current.start(meta));
		expect(onFinished).toHaveBeenCalledTimes(1);
		expect(onFinished).toHaveBeenCalledWith({ completed: 1, failed: 1 });
		expect(result.current.items.map((i) => i.file.name)).toEqual(["bad.jpg"]);
		expect(result.current.phase).toBe("idle");

		tusMock.failNames = new Set();
		tusMock.metadata = [];
		await act(async () => result.current.start(meta));
		expect(tusMock.metadata.map((m) => m.originalName)).toEqual(["bad.jpg"]);
		expect(result.current.phase).toBe("done");
	});

	it("dodanie plików po fazie 'done' wraca do 'idle'", async () => {
		const { result } = renderHook(() =>
			useUploadQueue({ errorMessage: "err" }),
		);
		act(() => result.current.addFiles([f("a.jpg")]));
		await act(async () => result.current.start(meta));
		expect(result.current.phase).toBe("done");
		act(() => result.current.addFiles([f("b.jpg")]));
		expect(result.current.phase).toBe("idle");
	});

	it("w trakcie wysyłki isUploading jest prawdziwe", async () => {
		tusMock.defer = true;
		const { result } = renderHook(() =>
			useUploadQueue({ errorMessage: "err" }),
		);
		act(() => result.current.addFiles([f("a.jpg")]));
		let pending: Promise<void> = Promise.resolve();
		act(() => {
			pending = result.current.start(meta);
		});
		expect(result.current.isUploading).toBe(true);
		await act(async () => {
			tusMock.pendingFinish?.();
			await pending;
		});
		expect(result.current.isUploading).toBe(false);
	});
});
