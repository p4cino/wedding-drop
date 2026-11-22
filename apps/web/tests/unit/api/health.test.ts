import { client } from "@wedding-drop/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../../../src/app/api/health/route";

vi.mock("@wedding-drop/db", () => ({
	client: vi.fn(),
}));

describe("GET /api/health", () => {
	const mockClient = client as unknown as ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("zwraca 200 i { status: 'ok' }, gdy baza PostgreSQL odpowiada", async () => {
		mockClient.mockResolvedValueOnce([{ "?column?": 1 }]);

		const res = await GET();
		expect(res.status).toBe(200);
		expect(res.headers.get("Cache-Control")).toBe("no-store");
		expect(await res.json()).toEqual({ status: "ok" });
	});

	it("zwraca 503 i { status: 'error' } bez wycieku szczegółów przy awarii DB", async () => {
		mockClient.mockRejectedValueOnce(
			new Error(
				"connect ECONNREFUSED postgres://wedding:wedding_secret@postgres:5432",
			),
		);

		const res = await GET();
		expect(res.status).toBe(503);
		expect(res.headers.get("Cache-Control")).toBe("no-store");

		const body = await res.json();
		expect(body).toEqual({ status: "error" });
		expect(JSON.stringify(body)).not.toContain("wedding_secret");
		expect(JSON.stringify(body)).not.toContain("ECONNREFUSED");
	});

	it("zwraca 503 przy przekroczeniu limitu czasu zapytania DB", async () => {
		vi.useFakeTimers();
		mockClient.mockImplementationOnce(() => new Promise(() => {}));

		const pendingRes = GET();
		await vi.advanceTimersByTimeAsync(2000);
		const res = await pendingRes;

		expect(res.status).toBe(503);
		expect(await res.json()).toEqual({ status: "error" });
	});
});
