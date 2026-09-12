import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as ownerHandler } from "@/app/api/owner/route";

vi.mock("bcryptjs", () => ({
	default: {
		compare: vi
			.fn()
			.mockImplementation((pwd) => Promise.resolve(pwd === "prawidloweHaslo")),
		hash: vi.fn().mockResolvedValue("hash123"),
	},
}));

vi.mock("node:fs/promises", () => ({
	default: {
		unlink: vi.fn().mockResolvedValue(undefined),
	},
}));

let mockGalleryList: any[] = [
	{
		id: "gal-1",
		slug: "kasia-i-tomek",
		coupleNames: "Kasia & Tomek",
		weddingDate: "2026-09-12",
		ownerPasswordHash: "hashedPassword",
		allowGuestDownloads: true,
		allowVideos: true,
		storagePath: "raw/test.jpg",
		thumbPath: "thumbs/test.webp",
	},
];

let _mockExistingCard: any[] = [{ id: "card-1" }];

vi.mock("@wedding-drop/db", async (importOriginal) => {
	const actual = await importOriginal<Record<string, any>>();
	return {
		...actual,
		db: {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi
							.fn()
							.mockImplementation(() => Promise.resolve(mockGalleryList)),
					})),
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
			insert: vi.fn(() => ({
				values: vi.fn().mockResolvedValue({}),
			})),
		},
	};
});

describe("Owner API Route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGalleryList = [
			{
				id: "gal-1",
				slug: "kasia-i-tomek",
				coupleNames: "Kasia & Tomek",
				weddingDate: "2026-09-12",
				ownerPasswordHash: "hashedPassword",
				allowGuestDownloads: true,
				allowVideos: true,
				storagePath: "raw/test.jpg",
				thumbPath: "thumbs/test.webp",
			},
		];
		_mockExistingCard = [{ id: "card-1" }];
	});

	it("powinien pomyślnie zalogować właściciela przy prawidłowym haśle", async () => {
		const req = new NextRequest("http://localhost/api/owner", {
			method: "POST",
			body: JSON.stringify({
				action: "login",
				slug: "kasia-i-tomek",
				password: "prawidloweHaslo",
			}),
		});

		const res = await ownerHandler(req);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.gallery.coupleNames).toBe("Kasia & Tomek");
	});

	it("powinien zwrócić 404, gdy galeria nie istnieje", async () => {
		mockGalleryList = [];
		const req = new NextRequest("http://localhost/api/owner", {
			method: "POST",
			body: JSON.stringify({
				action: "login",
				slug: "nieistniejaca",
				password: "prawidloweHaslo",
			}),
		});

		const res = await ownerHandler(req);
		expect(res.status).toBe(404);
	});

	it("powinien odrzucić logowanie przy błędnym haśle", async () => {
		const req = new NextRequest("http://localhost/api/owner", {
			method: "POST",
			body: JSON.stringify({
				action: "login",
				slug: "kasia-i-tomek",
				password: "zleHaslo",
			}),
		});

		const res = await ownerHandler(req);
		expect(res.status).toBe(401);
		const data = await res.json();
		expect(data.error).toBe("Nieprawidłowe hasło");
	});

	it("powinien odrzucić inne akcje przy błędnym haśle (401)", async () => {
		const req = new NextRequest("http://localhost/api/owner", {
			method: "POST",
			body: JSON.stringify({
				action: "toggle-status",
				slug: "kasia-i-tomek",
				password: "zleHaslo",
				mediaId: "m-123",
				newStatus: "hidden",
			}),
		});

		const res = await ownerHandler(req);
		expect(res.status).toBe(401);
		const data = await res.json();
		expect(data.error).toBe("Brak autoryzacji");
	});

	it("powinien zmienić status widoczności zdjęcia (toggle-status)", async () => {
		const req = new NextRequest("http://localhost/api/owner", {
			method: "POST",
			body: JSON.stringify({
				action: "toggle-status",
				slug: "kasia-i-tomek",
				password: "prawidloweHaslo",
				mediaId: "m-123",
				newStatus: "hidden",
			}),
		});

		const res = await ownerHandler(req);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.newStatus).toBe("hidden");
	});

	it("powinien usunąć zdjęcie przez delete-media", async () => {
		const req = new NextRequest("http://localhost/api/owner", {
			method: "POST",
			body: JSON.stringify({
				action: "delete-media",
				slug: "kasia-i-tomek",
				password: "prawidloweHaslo",
				mediaId: "m-123",
			}),
		});

		const res = await ownerHandler(req);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it("powinien zaktualizować ustawienia karteczki przez update-card", async () => {
		const req = new NextRequest("http://localhost/api/owner", {
			method: "POST",
			body: JSON.stringify({
				action: "update-card",
				slug: "kasia-i-tomek",
				password: "prawidloweHaslo",
				headline: "Nowy nagłówek",
				subheadline: "Nowy podtytuł",
				primaryColor: "#000000",
				accentColor: "#FFFFFF",
			}),
		});

		const res = await ownerHandler(req);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it("powinien zwrócić błąd 400 dla nieznanej akcji", async () => {
		const req = new NextRequest("http://localhost/api/owner", {
			method: "POST",
			body: JSON.stringify({
				action: "nieznana-akcja",
				slug: "kasia-i-tomek",
				password: "prawidloweHaslo",
			}),
		});

		const res = await ownerHandler(req);
		expect(res.status).toBe(400);
	});

	it("powinien obsłużyć błąd serwera (500)", async () => {
		const req = new NextRequest("http://localhost/api/owner", {
			method: "POST",
			body: "niepoprawny json",
		});

		const res = await ownerHandler(req);
		expect(res.status).toBe(500);
	});
});
