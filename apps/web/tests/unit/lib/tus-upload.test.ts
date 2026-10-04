// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadFileViaTus } from "@/lib/tus-upload";

interface Options {
	endpoint: string;
	chunkSize: number;
	retryDelays: number[];
	metadata: Record<string, string>;
	onError: (e: Error) => void;
	onProgress: (up: number, total: number) => void;
	onSuccess: () => void;
}

let lastOptions: Options | null = null;
let startSpy = vi.fn();

vi.mock("tus-js-client", () => ({
	Upload: class {
		constructor(_file: unknown, options: Options) {
			lastOptions = options;
		}
		start() {
			startSpy();
		}
	},
}));

const file = new File(["x"], "foto.jpg", { type: "image/jpeg" });

describe("uploadFileViaTus", () => {
	beforeEach(() => {
		lastOptions = null;
		startSpy = vi.fn();
		vi.useFakeTimers();
	});
	afterEach(() => vi.useRealTimers());

	it("konfiguruje klienta TUS (endpoint względem origin, chunk 5 MB, retry) i przekazuje metadane bez zmian", () => {
		const metadata = { gallerySlug: "s", source: "photographer" };
		uploadFileViaTus(file, metadata);
		expect(startSpy).toHaveBeenCalledTimes(1);
		expect(lastOptions?.endpoint).toBe(
			`${window.location.origin}/api/upload/tus`,
		);
		expect(lastOptions?.chunkSize).toBe(5 * 1024 * 1024);
		expect(lastOptions?.retryDelays).toEqual([0, 1000, 3000, 5000]);
		expect(lastOptions?.metadata).toBe(metadata);
	});

	it("rozwiązuje 'completed' po sukcesie i 'error' po błędzie", async () => {
		const ok = uploadFileViaTus(file, {});
		lastOptions?.onSuccess();
		await expect(ok).resolves.toBe("completed");

		vi.spyOn(console, "error").mockImplementation(() => {});
		const bad = uploadFileViaTus(file, {});
		lastOptions?.onError(new Error("sieć"));
		await expect(bad).resolves.toBe("error");
	});

	it("ogranicza częstość raportowania postępu (>= 3 pkt lub > 100 ms, zawsze 100%)", () => {
		const onProgress = vi.fn();
		vi.setSystemTime(1_000_000);
		uploadFileViaTus(file, {}, onProgress);
		const report = (pct: number) => lastOptions?.onProgress(pct, 100);

		report(1); // pierwszy raport (lastPercentage = -1 => przyrost >= 3)
		report(2); // +1 pkt i < 100 ms => pominięty
		vi.setSystemTime(1_000_050);
		report(3); // +2 pkt i 50 ms => pominięty
		report(4); // +3 pkt => zaraportowany
		vi.setSystemTime(1_000_300);
		report(5); // > 100 ms => zaraportowany
		report(100); // zawsze
		expect(onProgress.mock.calls.map((c) => c[0])).toEqual([1, 4, 5, 100]);
	});
});

describe("uploadFileViaTus - limit 1 GB", () => {
	it("plik większy niż 1 GiB kończy się tooLarge bez startu uploadu", async () => {
		const big = { name: "film.mp4", size: 1024 * 1024 * 1024 + 1 } as File;
		await expect(uploadFileViaTus(big, {})).resolves.toBe("tooLarge");
	});

	it("odpowiedź 413 serwera kończy się tooLarge", async () => {
		const p = uploadFileViaTus(file, {});
		const err = Object.assign(new Error("413"), {
			originalResponse: { getStatus: () => 413 },
		});
		lastOptions?.onError(err);
		await expect(p).resolves.toBe("tooLarge");
	});
});
