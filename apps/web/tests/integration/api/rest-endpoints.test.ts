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
		.mockImplementation(() =>
			Promise.resolve({ success: true, status: "started" }),
		),
}));

let mockGalleryList: Record<string, unknown>[] = [];
let mockAdminList: Record<string, unknown>[] = [];
let mockCardList: Record<string, unknown>[] = [];
let mockMediaList: Record<string, unknown>[] = [];
let mockGDriveResult: Record<string, unknown>[] = [];
let shouldThrowDb = false;

import { admins, cardSettings, mediaItems, galleryGdriveExports } from "@wedding-drop/db";

vi.mock("@wedding-drop/db", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		db: {
			select: vi.fn((_fields?: unknown) => {
				if (shouldThrowDb) {
					throw new Error("DB Error");
				}
				return {
					from: vi.fn((table) => {
						let result = mockGalleryList;
						if (table === admins) result = mockAdminList;
						else if (table === cardSettings) result = mockCardList;
						else if (table === mediaItems) result = mockMediaList;
						else if (table === galleryGdriveExports) result = mockGDriveResult;

						return {
							where: vi.fn(() => ({
								limit: vi
									.fn()
									.mockImplementation(() => Promise.resolve(result)),
								orderBy: vi.fn().mockResolvedValue(result),
								// biome-ignore lint/suspicious/noThenProperty: Drizzle ORM query mock
								then: (resolve: (val: unknown) => unknown) => resolve(result),
							})),
							leftJoin: vi.fn(() => ({
								where: vi.fn(() => ({
									limit: vi.fn().mockImplementation(() =>
										Promise.resolve(
											mockGalleryList.map((g: any) => ({
												gallery: g,
												gdrive: g.gdriveRefreshToken
													? {
															refreshToken: g.gdriveRefreshToken,
															accountEmail: g.gdriveAccountEmail,
															exportStatus: g.gdriveExportStatus,
															exportProgress: g.gdriveExportProgress,
															exportedAt: g.gdriveExportedAt,
															rootFolderId: g.gdriveRootFolderId,
														}
													: null,
											})),
										),
									),
								})),
								groupBy: vi.fn(() => ({
									orderBy: vi.fn().mockResolvedValue(mockGalleryList),
								})),
							})),
						};
					}),
				};
			}),
			insert: vi.fn(() => {
				if (shouldThrowDb) throw new Error("DB Error");
				return {
					values: vi.fn(() => {
						const res = [mockGalleryList[0] || { id: "new-gal" }];
						const promise = Promise.resolve(res);
						return Object.assign(promise, {
							returning: vi.fn().mockResolvedValue(res),
						});
					}),
				};
			}),
			update: vi.fn(() => {
				if (shouldThrowDb) throw new Error("DB Error");
				return {
					set: vi.fn(() => ({
						where: vi.fn().mockResolvedValue({}),
					})),
				};
			}),
			delete: vi.fn(() => {
				if (shouldThrowDb) throw new Error("DB Error");
				return {
					where: vi.fn().mockResolvedValue({}),
				};
			}),
		},
	};
});

describe("REST API Endpoints", () => {
	const slug = "kasia-i-tomek";
	let adminToken = "";
	let ownerToken = "";

	beforeEach(() => {
		vi.clearAllMocks();
		shouldThrowDb = false;
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

		mockCardList = [
			{
				id: "card-1",
				galleryId: "gal-1",
				headline: "Witajcie",
				subheadline: "Zdjęcia",
			},
		];

		mockMediaList = [
			{
				id: "m-1",
				galleryId: "gal-1",
				storagePath: "galleries/test/raw/file.jpg",
				thumbPath: "galleries/test/thumbs/file.webp",
			},
		];

		mockGDriveResult = [
			{
				galleryId: "gal-1",
				refreshToken: "token123",
				accountEmail: "kasia@gmail.com",
				exportStatus: "idle",
			},
		];
	});

	describe("Admin REST API", () => {
		it("POST /api/admin/auth - logowanie administratora z sukcesem", async () => {
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

		it("POST /api/admin/auth - nieznany admin zwraca 401", async () => {
			mockAdminList = [];
			const req = new NextRequest("http://localhost/api/admin/auth", {
				method: "POST",
				body: JSON.stringify({ username: "nieznany", password: "admin123" }),
			});
			const res = await adminAuthPost(req);
			expect(res.status).toBe(401);
		});

		it("POST /api/admin/auth - błędne hasło zwraca 401", async () => {
			const req = new NextRequest("http://localhost/api/admin/auth", {
				method: "POST",
				body: JSON.stringify({ username: "admin", password: "zle_haslo" }),
			});
			const res = await adminAuthPost(req);
			expect(res.status).toBe(401);
		});

		it("POST /api/admin/auth - błąd serwera zwraca 500", async () => {
			shouldThrowDb = true;
			const req = new NextRequest("http://localhost/api/admin/auth", {
				method: "POST",
				body: JSON.stringify({ username: "admin", password: "admin123" }),
			});
			const res = await adminAuthPost(req);
			expect(res.status).toBe(500);
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

		it("POST /api/admin/galleries - brak wymaganych pól zwraca 400", async () => {
			const req = new NextRequest("http://localhost/api/admin/galleries", {
				method: "POST",
				headers: { "x-admin-token": adminToken },
				body: JSON.stringify({
					coupleNames: "",
				}),
			});
			const res = await adminGalleriesPost(req);
			expect(res.status).toBe(400);
		});

		it("POST /api/admin/galleries - tworzenie z customSlug zwraca status 201", async () => {
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

		it("POST /api/admin/galleries - automatyczne generowanie sluga z polskich znaków i obsługa kolizji", async () => {
			// mockGalleryList ma już 1 element, więc kolizja wystąpi i wywoła losowy suffix
			const req = new NextRequest("http://localhost/api/admin/galleries", {
				method: "POST",
				headers: { "x-admin-token": adminToken },
				body: JSON.stringify({
					coupleNames: "Michał & Żaneta",
					weddingDate: "2026-08-20",
					ownerEmail: "michal@example.com",
					ownerPassword: "haslo",
					accessPin: "1234",
					maxStorageGb: "5",
				}),
			});
			const res = await adminGalleriesPost(req);
			expect(res.status).toBe(201);
		});

		it("POST /api/admin/galleries - błąd serwera zwraca 500", async () => {
			shouldThrowDb = true;
			const req = new NextRequest("http://localhost/api/admin/galleries", {
				method: "POST",
				headers: { "x-admin-token": adminToken },
				body: JSON.stringify({
					coupleNames: "Anna & Piotr",
					weddingDate: "2026-10-10",
					ownerEmail: "anna@example.com",
					ownerPassword: "haslo",
				}),
			});
			const res = await adminGalleriesPost(req);
			expect(res.status).toBe(500);
		});

		it("DELETE /api/admin/galleries/[id] - bez uprawnień administratora zwraca 401", async () => {
			const req = new NextRequest(
				"http://localhost/api/admin/galleries/gal-1",
				{ method: "DELETE" },
			);
			const res = await adminGalleryDelete(req, {
				params: Promise.resolve({ id: "gal-1" }),
			});
			expect(res.status).toBe(401);
		});

		it("DELETE /api/admin/galleries/[id] - usunięcie galerii z sukcesem", async () => {
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

		it("DELETE /api/admin/galleries/[id] - gdy galeria nie istnieje nadal zwraca 200", async () => {
			mockGalleryList = [];
			const req = new NextRequest(
				"http://localhost/api/admin/galleries/gal-brak",
				{
					method: "DELETE",
					headers: { "x-admin-token": adminToken },
				},
			);
			const res = await adminGalleryDelete(req, {
				params: Promise.resolve({ id: "gal-brak" }),
			});
			expect(res.status).toBe(200);
		});

		it("DELETE /api/admin/galleries/[id] - błąd serwera zwraca 500", async () => {
			shouldThrowDb = true;
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
			expect(res.status).toBe(500);
		});
	});

	describe("Owner REST API", () => {
		it("POST /api/owner/[slug]/auth - gdy galeria nie istnieje zwraca 404", async () => {
			mockGalleryList = [];
			const req = new NextRequest(`http://localhost/api/owner/nieznana/auth`, {
				method: "POST",
				body: JSON.stringify({ password: "owner123" }),
			});
			const res = await ownerAuthPost(req, {
				params: Promise.resolve({ slug: "nieznana" }),
			});
			expect(res.status).toBe(404);
		});

		it("POST /api/owner/[slug]/auth - nieprawidłowe hasło zwraca 401", async () => {
			const req = new NextRequest(`http://localhost/api/owner/${slug}/auth`, {
				method: "POST",
				body: JSON.stringify({ password: "zle_haslo" }),
			});
			const res = await ownerAuthPost(req, {
				params: Promise.resolve({ slug }),
			});
			expect(res.status).toBe(401);
		});

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

		it("POST /api/owner/[slug]/auth - błąd serwera zwraca 500", async () => {
			shouldThrowDb = true;
			const req = new NextRequest(`http://localhost/api/owner/${slug}/auth`, {
				method: "POST",
				body: JSON.stringify({ password: "owner123" }),
			});
			const res = await ownerAuthPost(req, {
				params: Promise.resolve({ slug }),
			});
			expect(res.status).toBe(500);
		});

		it("PATCH /api/owner/[slug]/media/[id]/status - bez autoryzacji zwraca 401", async () => {
			const req = new NextRequest(
				`http://localhost/api/owner/${slug}/media/m-1/status`,
				{
					method: "PATCH",
					body: JSON.stringify({ newStatus: "hidden" }),
				},
			);
			const res = await ownerMediaStatusPatch(req, {
				params: Promise.resolve({ slug, id: "m-1" }),
			});
			expect(res.status).toBe(401);
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

		it("PATCH /api/owner/[slug]/media/[id]/status - status inny niż hidden ustawia ready", async () => {
			const req = new NextRequest(
				`http://localhost/api/owner/${slug}/media/m-1/status`,
				{
					method: "PATCH",
					headers: { "x-owner-token": ownerToken },
					body: JSON.stringify({ newStatus: "custom" }),
				},
			);
			const res = await ownerMediaStatusPatch(req, {
				params: Promise.resolve({ slug, id: "m-1" }),
			});
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.newStatus).toBe("ready");
		});

		it("PATCH /api/owner/[slug]/media/[id]/status - błąd serwera zwraca 500", async () => {
			shouldThrowDb = true;
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
			expect(res.status).toBe(500);
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

		it("DELETE /api/owner/[slug]/media/[id] - gdy medium nie istnieje w bazie", async () => {
			mockMediaList = [];
			const req = new NextRequest(
				`http://localhost/api/owner/${slug}/media/m-brak`,
				{
					method: "DELETE",
					headers: { "x-owner-token": ownerToken },
				},
			);
			const res = await ownerMediaDelete(req, {
				params: Promise.resolve({ slug, id: "m-brak" }),
			});
			expect(res.status).toBe(200);
		});

		it("DELETE /api/owner/[slug]/media/[id] - błąd serwera zwraca 500", async () => {
			shouldThrowDb = true;
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
			expect(res.status).toBe(500);
		});

		it("PUT /api/owner/[slug]/card - zapis konfiguracji istniejącej winietki", async () => {
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

		it("PUT /api/owner/[slug]/card - utworzenie nowej winietki gdy nie istniała", async () => {
			mockCardList = [];
			const req = new NextRequest(`http://localhost/api/owner/${slug}/card`, {
				method: "PUT",
				headers: { "x-owner-token": ownerToken },
				body: JSON.stringify({
					headline: "Witamy!",
					subheadline: "Zdjęcia",
				}),
			});
			const res = await ownerCardPut(req, {
				params: Promise.resolve({ slug }),
			});
			expect(res.status).toBe(200);
		});

		it("PUT /api/owner/[slug]/card - błąd serwera zwraca 500", async () => {
			shouldThrowDb = true;
			const req = new NextRequest(`http://localhost/api/owner/${slug}/card`, {
				method: "PUT",
				headers: { "x-owner-token": ownerToken },
				body: JSON.stringify({ headline: "Test" }),
			});
			const res = await ownerCardPut(req, {
				params: Promise.resolve({ slug }),
			});
			expect(res.status).toBe(500);
		});

		it("GET /api/owner/[slug]/gdrive - pobranie statusu Google Drive", async () => {
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

		it("GET /api/owner/[slug]/gdrive - błąd serwera zwraca 500", async () => {
			shouldThrowDb = true;
			const req = new NextRequest(`http://localhost/api/owner/${slug}/gdrive`, {
				method: "GET",
				headers: { "x-owner-token": ownerToken },
			});
			const res = await ownerGDriveGet(req, {
				params: Promise.resolve({ slug }),
			});
			expect(res.status).toBe(500);
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

		it("DELETE /api/owner/[slug]/gdrive - błąd serwera zwraca 500", async () => {
			shouldThrowDb = true;
			const req = new NextRequest(`http://localhost/api/owner/${slug}/gdrive`, {
				method: "DELETE",
				headers: { "x-owner-token": ownerToken },
			});
			const res = await ownerGDriveDelete(req, {
				params: Promise.resolve({ slug }),
			});
			expect(res.status).toBe(500);
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

		it("POST /api/owner/[slug]/gdrive/export - błąd serwera zwraca 500", async () => {
			shouldThrowDb = true;
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
			expect(res.status).toBe(500);
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
