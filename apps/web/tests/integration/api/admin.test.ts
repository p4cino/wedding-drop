import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	POST as adminHandler,
	generateAdminToken,
} from "@/app/api/admin/route";

vi.mock("bcryptjs", () => ({
	default: {
		compare: vi
			.fn()
			.mockImplementation((pwd) => Promise.resolve(pwd === "admin123")),
		hash: vi.fn().mockResolvedValue("adminHash123"),
	},
}));

vi.mock("node:fs/promises", () => ({
	default: {
		mkdir: vi.fn().mockResolvedValue(undefined),
		rm: vi.fn().mockResolvedValue(undefined),
	},
}));

let mockAdmins: any[] = [
	{
		id: "admin-1",
		username: "admin",
		passwordHash: "adminHash123",
	},
];

const mockGalleries: any[] = [
	{
		id: "gal-1",
		slug: "kasia-i-tomek",
		coupleNames: "Kasia & Tomek",
		weddingDate: "2026-09-12",
		ownerEmail: "kasia@example.com",
		totalFiles: 10,
		totalBytes: 52428800,
	},
];

let existingSlugMatches = false;

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
								if (isAdmins) return Promise.resolve(mockAdmins);
								if (existingSlugMatches)
									return Promise.resolve([mockGalleries[0]]);
								return Promise.resolve([mockGalleries[0]]);
							}),
						})),
						leftJoin: vi.fn(() => ({
							groupBy: vi.fn(() => ({
								orderBy: vi.fn().mockResolvedValue(mockGalleries),
							})),
						})),
					};
				}),
			})),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn().mockResolvedValue([mockGalleries[0]]),
				})),
			})),
			delete: vi.fn(() => ({
				where: vi.fn().mockResolvedValue({}),
			})),
		},
	};
});

describe("Admin API Route", () => {
	let validToken = "";

	beforeEach(() => {
		vi.clearAllMocks();
		mockAdmins = [
			{
				id: "admin-1",
				username: "admin",
				passwordHash: "adminHash123",
			},
		];
		existingSlugMatches = false;
		validToken = generateAdminToken("admin");
	});

	it("powinien pomyślnie zalogować administratora przy prawidłowych danych", async () => {
		const req = new NextRequest("http://localhost/api/admin", {
			method: "POST",
			body: JSON.stringify({
				action: "login",
				username: "admin",
				password: "admin123",
			}),
		});

		const res = await adminHandler(req);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.adminToken).toContain("admin_");
	});

	it("powinien odrzucić logowanie, gdy admin nie istnieje w bazie", async () => {
		mockAdmins = [];
		const req = new NextRequest("http://localhost/api/admin", {
			method: "POST",
			body: JSON.stringify({
				action: "login",
				username: "nieznany",
				password: "admin123",
			}),
		});

		const res = await adminHandler(req);
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({ error: "Błędne dane logowania" });
	});

	it("powinien odrzucić logowanie przy niepoprawnym haśle", async () => {
		const req = new NextRequest("http://localhost/api/admin", {
			method: "POST",
			body: JSON.stringify({
				action: "login",
				username: "admin",
				password: "bledneHaslo",
			}),
		});

		const res = await adminHandler(req);
		expect(res.status).toBe(401);
	});

	it("powinien odrzucić żądanie bez tokena admina", async () => {
		const req = new NextRequest("http://localhost/api/admin", {
			method: "POST",
			body: JSON.stringify({
				action: "list-galleries",
			}),
		});

		const res = await adminHandler(req);
		expect(res.status).toBe(401);
	});

	it("powinien odrzucić żądanie ze sfałszowanym tokenem admina", async () => {
		const req = new NextRequest("http://localhost/api/admin", {
			method: "POST",
			body: JSON.stringify({
				action: "list-galleries",
				token: "admin_12345_fake_token",
			}),
		});

		const res = await adminHandler(req);
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({
			error: "Brak uprawnień administratora",
		});
	});

	it("powinien zwrócić listę galerii dla zalogowanego admina", async () => {
		const req = new NextRequest("http://localhost/api/admin", {
			method: "POST",
			body: JSON.stringify({
				action: "list-galleries",
				token: validToken,
			}),
		});

		const res = await adminHandler(req);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.galleries).toBeDefined();
		expect(data.galleries.length).toBe(1);
		expect(data.galleries[0].slug).toBe("kasia-i-tomek");
	});

	it("powinien utworzyć nową galerię z customSlug", async () => {
		const req = new NextRequest("http://localhost/api/admin", {
			method: "POST",
			body: JSON.stringify({
				action: "create-gallery",
				token: validToken,
				coupleNames: "Anna i Paweł",
				weddingDate: "2026-10-10",
				ownerEmail: "ania@example.com",
				ownerPassword: "haslo",
				customSlug: "ania-pawel",
			}),
		});

		const res = await adminHandler(req);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.gallery).toBeDefined();
	});

	it("powinien automatycznie wygenerować slug z polskich znaków, gdy brak customSlug", async () => {
		const req = new NextRequest("http://localhost/api/admin", {
			method: "POST",
			body: JSON.stringify({
				action: "create-gallery",
				token: validToken,
				coupleNames: "Żaneta i Michał",
				weddingDate: "2026-08-15",
				ownerEmail: "zaneta@example.com",
				ownerPassword: "haslo",
				maxStorageGb: "10",
			}),
		});

		const res = await adminHandler(req);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it("powinien oczyścić niebezpieczny customSlug (np. znaki specjalne, spacje, path traversal)", async () => {
		const req = new NextRequest("http://localhost/api/admin", {
			method: "POST",
			body: JSON.stringify({
				action: "create-gallery",
				token: validToken,
				coupleNames: "Para Testowa",
				weddingDate: "2026-09-20",
				ownerEmail: "test@example.com",
				ownerPassword: "haslo",
				customSlug: "zly slug!@# z path/../",
			}),
		});

		const res = await adminHandler(req);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.gallery.slug).toMatch(/^[a-z0-9_-]+$/);
		expect(data.gallery.slug).not.toContain("/");
		expect(data.gallery.slug).not.toContain("..");
		expect(data.gallery.slug).not.toContain(" ");
		expect(data.gallery.slug).not.toContain("!");
	});

	it("powinien odrzucić create-gallery, gdy brakuje wymaganych pól", async () => {
		const req = new NextRequest("http://localhost/api/admin", {
			method: "POST",
			body: JSON.stringify({
				action: "create-gallery",
				token: validToken,
				coupleNames: "",
			}),
		});

		const res = await adminHandler(req);
		expect(res.status).toBe(400);
	});

	it("powinien pomyślnie usunąć galerię przez delete-gallery", async () => {
		const req = new NextRequest("http://localhost/api/admin", {
			method: "POST",
			body: JSON.stringify({
				action: "delete-gallery",
				token: validToken,
				galleryId: "gal-1",
			}),
		});

		const res = await adminHandler(req);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it("powinien zwrócić błąd 400 dla nieznanej akcji", async () => {
		const req = new NextRequest("http://localhost/api/admin", {
			method: "POST",
			body: JSON.stringify({
				action: "unknown-action",
				token: validToken,
			}),
		});

		const res = await adminHandler(req);
		expect(res.status).toBe(400);
	});

	it("powinien zwrócić błąd 500 w przypadku awarii", async () => {
		const req = new NextRequest("http://localhost/api/admin", {
			method: "POST",
			body: "niepoprawny payload",
		});

		const res = await adminHandler(req);
		expect(res.status).toBe(500);
	});
});
