import type { IncomingMessage, ServerResponse } from "node:http";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleBrandingFileRequest } from "@/lib/branding-file-handler";

const mockStat = vi.fn();
vi.mock("node:fs/promises", () => ({
	stat: (...args: any[]) => mockStat(...args),
}));
vi.mock("node:fs", () => ({
	default: {
		createReadStream: vi.fn(),
	},
}));

describe("Branding File Handler", () => {
	let req: Partial<IncomingMessage>;
	let res: Partial<ServerResponse>;
	const dataDir = "/test/data";

	beforeEach(() => {
		req = { url: "" };
		res = {
			writeHead: vi.fn(),
			end: vi.fn(),
		};
		mockStat.mockReset();
	});

	it("should return false if url does not start with /branding-file/", async () => {
		req.url = "/api/something";
		const result = await handleBrandingFileRequest(
			req as IncomingMessage,
			res as ServerResponse,
			dataDir,
		);
		expect(result).toBe(false);
	});

	it("should detect path traversal in filename", async () => {
		// Zwracamy błąd ENOENT jak prawdziwy stat
		const error: any = new Error("Not found");
		error.code = "ENOENT";
		mockStat.mockRejectedValue(error);

		req.url = "/branding-file/test-slug/../etc/passwd";
		const result = await handleBrandingFileRequest(
			req as IncomingMessage,
			res as ServerResponse,
			dataDir,
		);
		expect(result).toBe(true);
		expect(res.writeHead).toHaveBeenCalledWith(404, expect.any(Object));
	});

	it("should detect path traversal in slug", async () => {
		req.url = "/branding-file/../../etc/logo.png";
		const result = await handleBrandingFileRequest(
			req as IncomingMessage,
			res as ServerResponse,
			dataDir,
		);
		expect(result).toBe(true);
		// slug `..` zostaje zsanityzowany do `""`, co zwraca 400
		expect(res.writeHead).toHaveBeenCalledWith(400, expect.any(Object));
	});

	it("serwuje plik z nosniff i restrykcyjnym CSP", async () => {
		mockStat.mockResolvedValue({ isFile: () => true, size: 3 });
		const fs = (await import("node:fs")).default as any;
		fs.createReadStream.mockReturnValue({ pipe: vi.fn() });
		req.url = "/branding-file/test-slug/logo.svg";
		await handleBrandingFileRequest(
			req as IncomingMessage,
			res as ServerResponse,
			dataDir,
		);
		expect(res.writeHead).toHaveBeenCalledWith(
			200,
			expect.objectContaining({
				"X-Content-Type-Options": "nosniff",
				"Content-Security-Policy": "default-src 'none'; sandbox",
			}),
		);
	});
});
