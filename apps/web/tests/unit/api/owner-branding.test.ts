import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { db, galleryBranding } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, POST } from "@/app/api/owner/[slug]/branding/route";
import { authenticateOwner } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
	authenticateOwner: vi.fn(),
}));

vi.mock("@wedding-drop/db", () => ({
	db: {
		query: {
			galleryBranding: {
				findFirst: vi.fn(),
			},
		},
		insert: vi.fn(() => ({
			values: vi.fn(),
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn(),
			})),
		})),
	},
	galleryBranding: {
		galleryId: "gallery_id_col",
	},
}));

const mockAuthenticateOwner = authenticateOwner as any;
const MOCK_GALLERY_ID = "mock-uuid-1234";
const PNG_BYTES = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
]);
const pngFile = (name = "logo.png", type = "image/png") =>
	new File([PNG_BYTES], name, { type });
const TEST_DATA_DIR = path.join(process.cwd(), "data-test");
const brandingDir = path.join(
	TEST_DATA_DIR,
	"galleries",
	"test-slug",
	"branding",
);

describe("Owner Branding API", () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.mocked(db.query.galleryBranding.findFirst).mockReset();
		mockAuthenticateOwner.mockReset();
		process.env.DATA_DIR = TEST_DATA_DIR;
		try {
			await mkdir(TEST_DATA_DIR, { recursive: true });
		} catch (e) {}
	});

	afterEach(async () => {
		try {
			await rm(TEST_DATA_DIR, { recursive: true, force: true });
		} catch (e) {}
	});

	describe("POST /api/owner/[slug]/branding", () => {
		it("should return 401 if unauthorized", async () => {
			mockAuthenticateOwner.mockResolvedValueOnce({
				authorized: false,
			});

			const req = new Request("http://localhost/api", {
				method: "POST",
			}) as unknown as NextRequest;

			const res = await POST(req, {
				params: Promise.resolve({ slug: "test-slug" }),
			});
			expect(res.status).toBe(401);
		});

		it("should return 400 if no file provided", async () => {
			mockAuthenticateOwner.mockResolvedValueOnce({
				authorized: true,
				gallery: { id: MOCK_GALLERY_ID },
			});

			const formData = new FormData();
			const req = new Request("http://localhost/api", {
				method: "POST",
				body: formData,
			}) as unknown as NextRequest;

			const res = await POST(req, {
				params: Promise.resolve({ slug: "test-slug" }),
			});
			expect(res.status).toBe(400);
		});

		it("should sanitize slug and prevent path traversal", async () => {
			mockAuthenticateOwner.mockResolvedValueOnce({
				authorized: true,
				gallery: { id: MOCK_GALLERY_ID },
			});

			const mockFind = vi.mocked(db.query.galleryBranding.findFirst);
			mockFind.mockResolvedValueOnce(undefined);

			const formData = new FormData();
			formData.append("logo", pngFile());

			const req = new Request("http://localhost/api", {
				method: "POST",
				body: formData,
			}) as unknown as NextRequest;

			const res = await POST(req, {
				params: Promise.resolve({ slug: "../../../etc" }),
			});
			expect(res.status).toBe(200);

			// ścieżka powinna pominąć '../../../etc' i zostać zsanityzowana do 'etc'
			const logoPath = path.join(
				TEST_DATA_DIR,
				"galleries",
				"etc",
				"branding",
				"logo.png",
			);
			const fileStat = await stat(logoPath);
			expect(fileStat.isFile()).toBe(true);
		});

		it("should upload a logo successfully", async () => {
			mockAuthenticateOwner.mockResolvedValueOnce({
				authorized: true,
				gallery: { id: MOCK_GALLERY_ID },
			});

			const mockFind = vi.mocked(db.query.galleryBranding.findFirst);
			mockFind.mockResolvedValueOnce(undefined);

			const formData = new FormData();
			formData.append("logo", pngFile());

			const req = new Request("http://localhost/api", {
				method: "POST",
				body: formData,
			}) as unknown as NextRequest;

			const res = await POST(req, {
				params: Promise.resolve({ slug: "test-slug" }),
			});
			expect(res.status).toBe(200);

			// Check file exists
			const logoPath = path.join(brandingDir, "logo.png");
			const fileStat = await stat(logoPath);
			expect(fileStat.isFile()).toBe(true);
		});
	});

	describe("POST - bezpieczeństwo plików", () => {
		const post = async (file: File, field = "logo") => {
			mockAuthenticateOwner.mockResolvedValueOnce({
				authorized: true,
				gallery: { id: MOCK_GALLERY_ID },
			});
			vi.mocked(db.query.galleryBranding.findFirst).mockResolvedValueOnce(
				undefined,
			);
			const formData = new FormData();
			formData.append(field, file);
			const req = new Request("http://localhost/api", {
				method: "POST",
				body: formData,
			}) as unknown as NextRequest;
			return POST(req, { params: Promise.resolve({ slug: "test-slug" }) });
		};

		it("nie zapisuje pliku poza katalogiem brandingu (traversal w rozszerzeniu)", async () => {
			const res = await post(pngFile("a.b/../../../../evil"));
			expect(res.status).toBe(200);
			await expect(stat(path.join(TEST_DATA_DIR, "evil"))).rejects.toThrow();
			await expect(
				stat(path.join(TEST_DATA_DIR, "galleries", "evil")),
			).rejects.toThrow();
			const saved = await stat(path.join(brandingDir, "logo.png"));
			expect(saved.isFile()).toBe(true);
		});

		it("odrzuca SVG (400)", async () => {
			const svg = new File(["<svg onload=alert(1)></svg>"], "logo.svg", {
				type: "image/svg+xml",
			});
			const res = await post(svg);
			expect(res.status).toBe(400);
		});

		it("odrzuca HTML podszywający się pod PNG (400)", async () => {
			const html = new File(["<html><script>1</script></html>"], "x.png", {
				type: "image/png",
			});
			const res = await post(html);
			expect(res.status).toBe(400);
			await expect(stat(path.join(brandingDir, "logo.png"))).rejects.toThrow();
		});

		it("rozszerzenie wynika z zawartości, a nie z nazwy pliku", async () => {
			const res = await post(pngFile("logo.jpg", "image/jpeg"));
			expect(res.status).toBe(200);
			const saved = await stat(path.join(brandingDir, "logo.png"));
			expect(saved.isFile()).toBe(true);
		});
	});

	describe("DELETE /api/owner/[slug]/branding", () => {
		it("should return 401 if unauthorized", async () => {
			mockAuthenticateOwner.mockResolvedValueOnce({
				authorized: false,
			});

			const req = new Request("http://localhost/api", {
				method: "DELETE",
			}) as unknown as NextRequest;

			const res = await DELETE(req, {
				params: Promise.resolve({ slug: "test-slug" }),
			});
			expect(res.status).toBe(401);
		});

		it("should remove file and clear db column", async () => {
			mockAuthenticateOwner.mockResolvedValueOnce({
				authorized: true,
				gallery: { id: MOCK_GALLERY_ID },
			});

			const mockFind = vi.mocked(db.query.galleryBranding.findFirst);
			mockFind.mockResolvedValueOnce({
				id: "mocked-id",
				galleryId: MOCK_GALLERY_ID,
				logoPath: "/data/galleries/test-slug/branding/logo.png",
				backgroundPath: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Create dummy file
			await mkdir(brandingDir, { recursive: true });
			const logoPath = path.join(brandingDir, "logo.png");
			await writeFile(logoPath, "test content");

			const req = new Request("http://localhost/api", {
				method: "DELETE",
				body: JSON.stringify({ type: "logo" }),
			}) as unknown as NextRequest;

			const res = await DELETE(req, {
				params: Promise.resolve({ slug: "test-slug" }),
			});
			expect(res.status).toBe(200);

			// Check file is removed
			await expect(stat(logoPath)).rejects.toThrow();

			// Check db update was called
			expect(db.update).toHaveBeenCalled();
		});
	});
});
