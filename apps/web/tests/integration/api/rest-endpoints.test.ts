import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as adminAuthPost } from "@/app/api/admin/auth/route";
import { DELETE as adminGalleryDelete } from "@/app/api/admin/galleries/[id]/route";
import {
	GET as adminGalleriesGet,
	POST as adminGalleriesPost,
} from "@/app/api/admin/galleries/route";
import { POST as ownerAuthPost } from "@/app/api/owner/[slug]/auth/route";
import { PUT as ownerCardPut } from "@/app/api/owner/[slug]/card/route";
import { POST as ownerGDriveExportPost } from "@/app/api/owner/[slug]/gdrive/export/route";
import {
	DELETE as ownerGDriveDelete,
	GET as ownerGDriveGet,
} from "@/app/api/owner/[slug]/gdrive/route";
import { DELETE as ownerMediaDelete } from "@/app/api/owner/[slug]/media/[id]/route";
import { PATCH as ownerMediaStatusPatch } from "@/app/api/owner/[slug]/media/[id]/status/route";
import { generateAdminToken, generateOwnerToken } from "@/lib/auth";

vi.mock("bcryptjs", () => ({
	default: {
		compare: vi
			.fn()
			.mockImplementation((pwd) =>
				Promise.resolve(pwd === "admin123" || pwd === "owner123"),
			),
		hash: vi.fn().mockResolvedValue("hash123"),
	},
}));

vi.mock("node:fs/promises", () => ({
	default: {
		mkdir: vi.fn().mockResolvedValue(undefined),
		rm: vi.fn().mockResolvedValue(undefined),
		unlink: vi.fn().mockResolvedValue(undefined),
	},
}));

vi.mock("@wedding-drop/media", () => ({
	sseBus: {
		notifyMediaUpdated: vi.fn(),
	},
	isGoogleDriveConfigured: vi.fn().mockReturnValue(true),
	startGalleryDriveExport: vi
		.fn()
		.mockResolvedValue({ success: true, status: "started" }),
}));

let mockGalleryList: any[] = [];
let mockAdminList: any[] = [];

import { admins } from "@wedding-drop/db";

vi.mock("@wedding-drop/db", async (importOriginal) => {
	const actual = await importOriginal<Record<string, any>>();
	return {
		...actual,
		db: {
			select: vi.fn(() => ({
				from: vi.fn((table) => {
					const isAdmins = table === admins;
					return {
						where: vi.fn(() => ({
							limit: vi.fn().mockImplementation(() => {
								if (isAdmins) return Promise.resolve(mockAdminList);
								return Promise.resolve(mockGalleryList);
							}),
						})),
						leftJoin: vi.fn(() => ({
							groupBy: vi.fn(() => ({
								orderBy: vi.fn().mockResolvedValue(mockGalleryList),
							})),
						})),
					};
				}),
			})),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn().mockResolvedValue([mockGalleryList[0]]),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn().mockResolvedValue({}),
				})),
			})),
			delete: vi.fn(() => ({
				where: vi.fn().mockResolvedValue({}),
			})),
		},
	};
});

describe("REST API Endpoints", () => {
	const slug = "kasia-i-tomek";
	let adminToken = "";
	let ownerToken = "";

	beforeEach(() => {
		vi.clearAllMocks();
		adminToken = generateAdminToken("admin");
		ownerToken = generateOwnerToken(slug);

		mockAdminList = [
			{
				id: "admin-1",
				username: "admin",
				passwordHash: "adminHash123",
			},
		];

		mockGalleryList = [
			{
				id: "gal-1",
				slug,
				coupleNames: "Kasia & Tomek",
				weddingDate: "2026-09-12",
				ownerEmail: "kasia@example.com",
				ownerPasswordHash: "hashedPassword",
				allowGuestDownloads: true,
				allowVideos: true,
				storagePath: "raw/test.jpg",
				thumbPath: "thumbs/test.webp",
				gdriveRefreshToken: "token123",
				gdriveAccountEmail: "kasia@gmail.com",
				gdriveExportStatus: "idle",
			},
		];
	});

	describe("Admin REST API", () => {
		it("POST /api/admin/auth - logowanie administratora", async () => {
			const req = new NextRequest("http://localhost/api/admin/auth", {
				method: "POST",
				body: JSON.stringify({ username: "admin", password: "admin123" }),
			});
			const res = await adminAuthPost(req);
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.success).toBe(true);
			expect(data.adminToken).toBeDefined();
		});

		it("GET /api/admin/galleries - pobieranie listy galerii", async () => {
			const req = new NextRequest("http://localhost/api/admin/galleries", {
				method: "GET",
				headers: { "x-admin-token": adminToken },
			});
			const res = await adminGalleriesGet(req);
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.galleries).toBeDefined();
		});

		it("POST /api/admin/galleries - tworzenie nowej galerii zwraca status 201 Created", async () => {
			const req = new NextRequest("http://localhost/api/admin/galleries", {
				method: "POST",
				headers: { "x-admin-token": adminToken },
				body: JSON.stringify({
					coupleNames: "Anna & Piotr",
					weddingDate: "2026-10-10",
					ownerEmail: "anna@example.com",
					ownerPassword: "haslo",
					customSlug: "anna-i-piotr",
				}),
			});
			const res = await adminGalleriesPost(req);
			expect(res.status).toBe(201);
			const data = await res.json();
			expect(data.success).toBe(true);
			expect(data.gallery).toBeDefined();
		});

		it("DELETE /api/admin/galleries/[id] - usunięcie galerii", async () => {
			const req = new NextRequest(
				"http://localhost/api/admin/galleries/gal-1",
				{
					method: "DELETE",
					headers: { "x-admin-token": adminToken },
				},
			);
			const res = await adminGalleryDelete(req, {
				params: Promise.resolve({ id: "gal-1" }),
			});
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.success).toBe(true);
		});
	});

	describe("Owner REST API", () => {
		it("POST /api/owner/[slug]/auth - logowanie pary młodej i wydanie tokenu HMAC", async () => {
			const req = new NextRequest(`http://localhost/api/owner/${slug}/auth`, {
				method: "POST",
				body: JSON.stringify({ password: "owner123" }),
			});
			const res = await ownerAuthPost(req, {
				params: Promise.resolve({ slug }),
			});
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.success).toBe(true);
			expect(data.ownerToken).toBeDefined();
			expect(data.ownerToken.startsWith("owner_")).toBe(true);
		});

		it("PATCH /api/owner/[slug]/media/[id]/status - zmiana widoczności z tokenem HMAC", async () => {
			const req = new NextRequest(
				`http://localhost/api/owner/${slug}/media/m-1/status`,
				{
					method: "PATCH",
					headers: { "x-owner-token": ownerToken },
					body: JSON.stringify({ newStatus: "hidden" }),
				},
			);
			const res = await ownerMediaStatusPatch(req, {
				params: Promise.resolve({ slug, id: "m-1" }),
			});
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.success).toBe(true);
			expect(data.newStatus).toBe("hidden");
		});

		it("DELETE /api/owner/[slug]/media/[id] - usunięcie zdjęcia z tokenem HMAC", async () => {
			const req = new NextRequest(
				`http://localhost/api/owner/${slug}/media/m-1`,
				{
					method: "DELETE",
					headers: { "x-owner-token": ownerToken },
				},
			);
			const res = await ownerMediaDelete(req, {
				params: Promise.resolve({ slug, id: "m-1" }),
			});
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.success).toBe(true);
		});

		it("PUT /api/owner/[slug]/card - zapis konfiguracji winietki", async () => {
			const req = new NextRequest(`http://localhost/api/owner/${slug}/card`, {
				method: "PUT",
				headers: { "x-owner-token": ownerToken },
				body: JSON.stringify({
					headline: "Witamy!",
					subheadline: "Zdjęcia",
					primaryColor: "#000",
					accentColor: "#fff",
				}),
			});
			const res = await ownerCardPut(req, {
				params: Promise.resolve({ slug }),
			});
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.success).toBe(true);
		});

		it("GET /api/owner/[slug]/gdrive - pobranie statusu eksportu Google Drive", async () => {
			const req = new NextRequest(`http://localhost/api/owner/${slug}/gdrive`, {
				method: "GET",
				headers: { "x-owner-token": ownerToken },
			});
			const res = await ownerGDriveGet(req, {
				params: Promise.resolve({ slug }),
			});
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.success).toBe(true);
			expect(data.hasGDrive).toBe(true);
		});

		it("DELETE /api/owner/[slug]/gdrive - odłączenie konta Google Drive", async () => {
			const req = new NextRequest(`http://localhost/api/owner/${slug}/gdrive`, {
				method: "DELETE",
				headers: { "x-owner-token": ownerToken },
			});
			const res = await ownerGDriveDelete(req, {
				params: Promise.resolve({ slug }),
			});
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.success).toBe(true);
		});

		it("POST /api/owner/[slug]/gdrive/export - uruchomienie eksportu do Google Drive", async () => {
			const req = new NextRequest(
				`http://localhost/api/owner/${slug}/gdrive/export`,
				{
					method: "POST",
					headers: { "x-owner-token": ownerToken },
					body: JSON.stringify({ includeHidden: true }),
				},
			);
			const res = await ownerGDriveExportPost(req, {
				params: Promise.resolve({ slug }),
			});
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.success).toBe(true);
		});

		it("powinien odrzucić żądanie do endpointu ownera z niepoprawnym tokenem (401)", async () => {
			const req = new NextRequest(
				`http://localhost/api/owner/${slug}/media/m-1`,
				{
					method: "DELETE",
					headers: { "x-owner-token": "nieprawidlowy-token" },
				},
			);
			const res = await ownerMediaDelete(req, {
				params: Promise.resolve({ slug, id: "m-1" }),
			});
			expect(res.status).toBe(401);
		});
	});
});
