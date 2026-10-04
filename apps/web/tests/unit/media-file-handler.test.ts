import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { Writable } from "node:stream";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import {
	generateAdminToken,
	generateGuestToken,
	generateOwnerToken,
	guestSessionCookieName,
} from "@/lib/auth";
import { handleMediaFileRequest } from "@/lib/media-file-handler";

let mockMediaItemStatus: string | null = "ready";
let mockGallerySlug = "test-slug";
let mockGuestPassword: null | string = null;

vi.mock("@wedding-drop/db", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		db: {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					innerJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn(() => {
								if (!mockMediaItemStatus) return [];
								return [
									{
										status: mockMediaItemStatus,
										gallerySlug: mockGallerySlug,
										guestPassword: mockGuestPassword,
									},
								];
							}),
						})),
					})),
				})),
			})),
		},
	};
});

function createMockReq(options: {
	url?: string;
	headers?: Record<string, string>;
}): IncomingMessage {
	return {
		url: options.url || "/",
		headers: options.headers || {},
	} as unknown as IncomingMessage;
}

class MockResponse extends Writable {
	statusCode = 200;
	headersSent = false;
	headers: Record<string, string | number> = {};
	body = "";

	writeHead(status: number, headers?: Record<string, string | number>) {
		this.statusCode = status;
		this.headersSent = true;
		if (headers) {
			Object.assign(this.headers, headers);
		}
		return this;
	}

	setHeader(key: string, value: string | number) {
		this.headers[key.toLowerCase()] = value;
		return this;
	}

	_write(
		chunk: Buffer | string,
		_encoding: BufferEncoding,
		callback: (error?: Error | null) => void,
	) {
		this.body += chunk.toString();
		callback();
	}
}

function waitForResponse(res: MockResponse): Promise<void> {
	return new Promise((resolve) => {
		if (res.writableEnded) {
			resolve();
		} else {
			res.on("finish", resolve);
		}
	});
}

describe("handleMediaFileRequest", () => {
	const testDataDir = path.join(
		process.cwd(),
		"tests",
		"fixtures",
		"media-data",
	);
	const testGalleriesDir = path.join(testDataDir, "galleries", "test-slug");
	const testFilePath = path.join(testGalleriesDir, "sample.jpg");

	beforeAll(() => {
		fs.mkdirSync(testGalleriesDir, { recursive: true });
		fs.writeFileSync(testFilePath, "FAKE_IMAGE_DATA_1234567890");
	});

	afterAll(async () => {
		// Dajemy chwilę na domknięcie otwartych deskryptorów
		await new Promise((r) => setTimeout(r, 50));
		try {
			fs.rmSync(testDataDir, { recursive: true, force: true });
		} catch {
			// ignore cleanup error
		}
	});

	beforeEach(() => {
		mockMediaItemStatus = "ready";
		mockGallerySlug = "test-slug";
		mockGuestPassword = null;
	});

	it("powinien zignorować zapytania niebędące /media-file/ i zwrócić false", async () => {
		const req = createMockReq({ url: "/api/gallery/test" });
		const res = new MockResponse();
		const handled = await handleMediaFileRequest(
			req,
			res as unknown as ServerResponse,
			testDataDir,
		);
		expect(handled).toBe(false);
		expect(res.headersSent).toBe(false);
	});

	it("powinien odrzucić próbę Path Traversal (..) kodem 403", async () => {
		const req = createMockReq({ url: "/media-file/../../etc/passwd" });
		const res = new MockResponse();
		const handled = await handleMediaFileRequest(
			req,
			res as unknown as ServerResponse,
			testDataDir,
		);
		expect(handled).toBe(true);
		expect(res.statusCode).toBe(403);
	});

	it("powinien odrzucić próbę wstrzyknięcia null byte (%00) kodem 403", async () => {
		const req = createMockReq({ url: "/media-file/sample.jpg%00.png" });
		const res = new MockResponse();
		const handled = await handleMediaFileRequest(
			req,
			res as unknown as ServerResponse,
			testDataDir,
		);
		expect(handled).toBe(true);
		expect(res.statusCode).toBe(403);
	});

	it("powinien zwrócić 404 dla nieistniejącego pliku", async () => {
		const req = createMockReq({
			url: "/media-file/galleries/test-slug/non-existent.jpg",
		});
		const res = new MockResponse();
		const handled = await handleMediaFileRequest(
			req,
			res as unknown as ServerResponse,
			testDataDir,
		);
		expect(handled).toBe(true);
		expect(res.statusCode).toBe(404);
	});

	it("powinien zwrócić 200 i zaserwować plik bez nagłówka Range dla statusu ready", async () => {
		const req = createMockReq({
			url: "/media-file/galleries/test-slug/sample.jpg",
		});
		const res = new MockResponse();
		const handled = await handleMediaFileRequest(
			req,
			res as unknown as ServerResponse,
			testDataDir,
		);
		expect(handled).toBe(true);
		await waitForResponse(res);
		expect(res.statusCode).toBe(200);
		expect(res.headers["Content-Type"]).toBe("image/jpeg");
		expect(res.headers["X-Content-Type-Options"]).toBe("nosniff");
		expect(res.body).toBe("FAKE_IMAGE_DATA_1234567890");
	});

	it("powinien obsłużyć zapytanie Byte-Range kodem 206 Partial Content", async () => {
		const req = createMockReq({
			url: "/media-file/galleries/test-slug/sample.jpg",
			headers: { range: "bytes=0-4" },
		});
		const res = new MockResponse();
		const handled = await handleMediaFileRequest(
			req,
			res as unknown as ServerResponse,
			testDataDir,
		);
		expect(handled).toBe(true);
		await waitForResponse(res);
		expect(res.statusCode).toBe(206);
		expect(res.headers["Content-Range"]).toMatch(/^bytes 0-4\//);
		expect(res.headers["Content-Length"]).toBe(5);
		expect(res.body).toBe("FAKE_");
	});

	it("powinien odrzucić nieprawidłowy zakres Range kodem 416", async () => {
		const req = createMockReq({
			url: "/media-file/galleries/test-slug/sample.jpg",
			headers: { range: "bytes=9999-10000" },
		});
		const res = new MockResponse();
		const handled = await handleMediaFileRequest(
			req,
			res as unknown as ServerResponse,
			testDataDir,
		);
		expect(handled).toBe(true);
		expect(res.statusCode).toBe(416);
	});

	it("powinien zablokować plik ze statusem hidden dla niezalogowanego gościa (kod 403)", async () => {
		mockMediaItemStatus = "hidden";
		const req = createMockReq({
			url: "/media-file/galleries/test-slug/sample.jpg",
		});
		const res = new MockResponse();
		const handled = await handleMediaFileRequest(
			req,
			res as unknown as ServerResponse,
			testDataDir,
		);
		expect(handled).toBe(true);
		expect(res.statusCode).toBe(403);
	});

	it("powinien zablokować plik ze statusem pending dla niezalogowanego gościa (kod 403)", async () => {
		mockMediaItemStatus = "pending";
		const req = createMockReq({
			url: "/media-file/galleries/test-slug/sample.jpg",
		});
		const res = new MockResponse();
		const handled = await handleMediaFileRequest(
			req,
			res as unknown as ServerResponse,
			testDataDir,
		);
		expect(handled).toBe(true);
		expect(res.statusCode).toBe(403);
	});

	it("powinien zezwolić na dostęp do pliku ze statusem hidden dla właściciela z tokenem", async () => {
		mockMediaItemStatus = "hidden";
		const ownerToken = generateOwnerToken("test-slug");
		const req = createMockReq({
			url: "/media-file/galleries/test-slug/sample.jpg",
			headers: { "x-owner-token": ownerToken },
		});
		const res = new MockResponse();
		const handled = await handleMediaFileRequest(
			req,
			res as unknown as ServerResponse,
			testDataDir,
		);
		expect(handled).toBe(true);
		await waitForResponse(res);
		expect(res.statusCode).toBe(200);
	});

	it("powinien zezwolić na dostęp do pliku ze statusem hidden dla administratora z tokenem", async () => {
		mockMediaItemStatus = "hidden";
		const adminToken = generateAdminToken("admin");
		const req = createMockReq({
			url: "/media-file/galleries/test-slug/sample.jpg",
			headers: { "x-admin-token": adminToken },
		});
		const res = new MockResponse();
		const handled = await handleMediaFileRequest(
			req,
			res as unknown as ServerResponse,
			testDataDir,
		);
		expect(handled).toBe(true);
		await waitForResponse(res);
		expect(res.statusCode).toBe(200);
	});

	it("powinien zwrócić 404 dla pliku ze statusem deleted w bazie", async () => {
		mockMediaItemStatus = "deleted";
		const req = createMockReq({
			url: "/media-file/galleries/test-slug/sample.jpg",
		});
		const res = new MockResponse();
		const handled = await handleMediaFileRequest(
			req,
			res as unknown as ServerResponse,
			testDataDir,
		);
		expect(handled).toBe(true);
		expect(res.statusCode).toBe(404);
	});

	it("powinien zablokować plik ze statusem ready, jeśli galeria wymaga hasła gościa, ale gość nie jest zalogowany", async () => {
		mockMediaItemStatus = "ready";
		mockGuestPassword = "secret-password";
		const req = createMockReq({
			url: "/media-file/galleries/test-slug/sample.jpg",
		});
		const res = new MockResponse();
		const handled = await handleMediaFileRequest(
			req,
			res as unknown as ServerResponse,
			testDataDir,
		);
		expect(handled).toBe(true);
		expect(res.statusCode).toBe(403);
	});

	it("powinien zezwolić na dostęp do pliku ze statusem ready z hasłem gościa, jeśli gość ma poprawny token", async () => {
		mockMediaItemStatus = "ready";
		mockGuestPassword = "secret-password";
		const guestToken = generateGuestToken("test-slug");
		const req = createMockReq({
			url: "/media-file/galleries/test-slug/sample.jpg",
			headers: {
				cookie: `${guestSessionCookieName("test-slug")}=${encodeURIComponent(guestToken)}`,
			},
		});
		const res = new MockResponse();
		const handled = await handleMediaFileRequest(
			req,
			res as unknown as ServerResponse,
			testDataDir,
		);
		expect(handled).toBe(true);
		await waitForResponse(res);
		expect(res.statusCode).toBe(200);
	});
});
