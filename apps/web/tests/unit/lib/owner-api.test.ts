import { afterEach, describe, expect, it, vi } from "vitest";
import { ownerRequest } from "@/lib/owner-api";

const respond = (body: unknown, status = 200) =>
	new Response(body === null ? null : JSON.stringify(body), { status });

describe("ownerRequest", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("dokłada token w nagłówku x-owner-token i nie wysyła go w body", async () => {
		const fetchMock = vi.fn().mockResolvedValue(respond({ success: true }));
		vi.stubGlobal("fetch", fetchMock);
		const res = await ownerRequest("tok", "PATCH", "/api/x", {
			newStatus: "hidden",
		});

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe("/api/x");
		expect(init.method).toBe("PATCH");
		expect(init.headers["x-owner-token"]).toBe("tok");
		expect(init.headers["Content-Type"]).toBe("application/json");
		expect(JSON.parse(init.body)).toEqual({ newStatus: "hidden" });
		expect(res).toEqual({ ok: true, status: 200, data: { success: true } });
	});

	it("bez body nie ustawia Content-Type, a bez tokenu pomija nagłówek", async () => {
		const fetchMock = vi.fn().mockResolvedValue(respond({}));
		vi.stubGlobal("fetch", fetchMock);
		await ownerRequest("", "DELETE", "/api/y");
		const init = fetchMock.mock.calls[0][1];
		expect(init.body).toBeUndefined();
		expect(init.headers).toEqual({});
	});

	it("zwraca ok=false z kodem HTTP i danymi błędu", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(respond({ error: "Brak" }, 401)),
		);
		const res = await ownerRequest<{ error: string }>("t", "GET", "/api/z");
		expect(res).toEqual({ ok: false, status: 401, data: { error: "Brak" } });
	});

	it("odpowiedź bez JSON-a daje data=null", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response("", { status: 200 })),
		);
		const res = await ownerRequest("t", "DELETE", "/api/z");
		expect(res).toEqual({ ok: true, status: 200, data: null });
	});

	it("błąd sieci nie rzuca wyjątku (status 0)", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
		expect(await ownerRequest("t", "GET", "/api/z")).toEqual({
			ok: false,
			status: 0,
			data: null,
		});
	});
});
