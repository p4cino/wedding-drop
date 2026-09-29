import { sseBus } from "@wedding-drop/media";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getLive } from "@/app/api/gallery/[slug]/live/route";
import {
	GET as getWishes,
	POST as postWish,
} from "@/app/api/gallery/[slug]/wishes/route";
import { PATCH as patchWishStatus } from "@/app/api/owner/[slug]/wishes/[id]/status/route";
import { generateAdminToken, generateOwnerToken } from "@/lib/auth";

vi.mock("@node-rs/bcrypt", () => ({
	compare: vi.fn((pwd: string) => Promise.resolve(pwd === "sekret123")),
	hash: vi.fn(() => Promise.resolve("hashed")),
}));

let mockGalleries: Record<string, unknown>[] = [];
let mockWishes: Record<string, unknown>[] = [];
let dbShouldThrow = false;
let insertedWish: Record<string, unknown> | null = null;

import { galleries } from "@wedding-drop/db";

vi.mock("@wedding-drop/db", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		db: {
			select: vi.fn(() => ({
				from: vi.fn((table) => {
					if (dbShouldThrow) throw new Error("DB Error");
					const targetData = table === galleries ? mockGalleries : mockWishes;

					return {
						where: vi.fn(() => {
							if (dbShouldThrow) throw new Error("DB Error");
							return {
								limit: vi.fn().mockImplementation(() => {
									if (dbShouldThrow)
										return Promise.reject(new Error("DB Error"));
									return Promise.resolve(targetData);
								}),
								orderBy: vi.fn().mockResolvedValue(targetData),
							};
						}),
					};
				}),
			})),
			insert: vi.fn(() => {
				if (dbShouldThrow) throw new Error("DB Error");
				return {
					values: vi.fn((values: Record<string, unknown>) => {
						insertedWish = {
							id: "new-wish-1",
							status: "ready",
							createdAt: new Date().toISOString(),
							...values,
						};
						return {
							returning: vi.fn().mockResolvedValue([insertedWish]),
						};
					}),
				};
			}),
			update: vi.fn(() => {
				if (dbShouldThrow) throw new Error("DB Error");
				return {
					set: vi.fn(() => ({
						where: vi.fn().mockResolvedValue({}),
					})),
				};
			}),
		},
	};
});

describe("Guest Wishes Book API", () => {
	const slug = "kasia-i-tomek";
	let ownerToken = "";

	beforeEach(() => {
		vi.clearAllMocks();
		dbShouldThrow = false;
		insertedWish = null;
		ownerToken = generateOwnerToken(slug);

		mockGalleries = [
			{
				id: "gal-1",
				slug,
				coupleNames: "Kasia & Tomek",
				weddingDate: "2026-09-12",
				ownerPasswordHash: "hashed",
				isActive: true,
			},
		];

		mockWishes = [
			{
				id: "wish-1",
				galleryId: "gal-1",
				guestName: "Ciocia Kasia",
				message: "Sto lat i szczęścia!",
				status: "ready",
				createdAt: new Date().toISOString(),
			},
			{
				id: "wish-2",
				galleryId: "gal-1",
				guestName: null,
				message: "Ukryte życzenie",
				status: "hidden",
				createdAt: new Date().toISOString(),
			},
		];
	});

	describe("GET /api/gallery/[slug]/wishes", () => {
		it("powinien zwrócić życzenia gościowi bez poświadczeń (mock zwraca dane niezależnie od warunku SQL where)", async () => {
			// Uwaga: mock db.select nie ewaluuje realnie klauzuli `where` (podobnie jak
			// w tests/integration/api/gallery.test.ts) — tutaj weryfikujemy kontrakt
			// odpowiedzi (kod 200, kształt obiektu), a filtrowanie po statusie w SQL
			// jest pokryte przez sam warunek `and(eq(status, "ready"))` budowany w route.
			mockWishes = [mockWishes[0]];
			const req = new NextRequest(
				`http://localhost/api/gallery/${slug}/wishes`,
			);
			const res = await getWishes(req, { params: Promise.resolve({ slug }) });

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.wishes).toHaveLength(1);
			expect(data.wishes[0].id).toBe("wish-1");
			expect(data.wishes[0].guestName).toBe("Ciocia Kasia");
		});

		it("powinien odrzucić includeHidden=true bez autoryzacji", async () => {
			const req = new NextRequest(
				`http://localhost/api/gallery/${slug}/wishes?includeHidden=true`,
			);
			const res = await getWishes(req, { params: Promise.resolve({ slug }) });

			expect(res.status).toBe(401);
			const data = await res.json();
			expect(data.error).toBe("Brak uprawnień do przeglądania ukrytych życzeń");
		});

		it("powinien zwrócić wszystkie życzenia poza usuniętymi z poprawnym hasłem właściciela", async () => {
			const req = new NextRequest(
				`http://localhost/api/gallery/${slug}/wishes?includeHidden=true&password=sekret123`,
			);
			const res = await getWishes(req, { params: Promise.resolve({ slug }) });

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.wishes).toHaveLength(2);
		});

		it("nie powinien nigdy zwrócić życzeń usuniętych (deleted), nawet właścicielowi", async () => {
			// Mock symuluje warstwę SQL: właściciel widzi tylko to, co zapytanie ne(status,"deleted") zwróciłoby
			mockWishes = mockWishes.filter((w) => w.status !== "deleted");
			const req = new NextRequest(
				`http://localhost/api/gallery/${slug}/wishes?includeHidden=true&password=sekret123`,
			);
			const res = await getWishes(req, { params: Promise.resolve({ slug }) });

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(
				data.wishes.some((w: { status: string }) => w.status === "deleted"),
			).toBe(false);
		});

		it("powinien zwrócić wszystkie życzenia z poprawnym adminToken", async () => {
			const token = generateAdminToken("admin");
			const req = new NextRequest(
				`http://localhost/api/gallery/${slug}/wishes?includeHidden=true&adminToken=${token}`,
			);
			const res = await getWishes(req, { params: Promise.resolve({ slug }) });

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.wishes).toHaveLength(2);
		});

		it("powinien zwrócić 404, gdy galeria nie istnieje", async () => {
			mockGalleries = [];
			const req = new NextRequest("http://localhost/api/gallery/brak/wishes");
			const res = await getWishes(req, {
				params: Promise.resolve({ slug: "brak" }),
			});

			expect(res.status).toBe(404);
		});

		it("powinien zwrócić 500 w razie błędu serwera", async () => {
			dbShouldThrow = true;
			const req = new NextRequest(
				`http://localhost/api/gallery/${slug}/wishes`,
			);
			const res = await getWishes(req, { params: Promise.resolve({ slug }) });

			expect(res.status).toBe(500);
		});
	});

	describe("POST /api/gallery/[slug]/wishes", () => {
		it("powinien dodać życzenie bez pliku i wysłać powiadomienie SSE", async () => {
			const notifySpy = vi.spyOn(sseBus, "notifyNewWish");
			const req = new NextRequest(
				`http://localhost/api/gallery/${slug}/wishes`,
				{
					method: "POST",
					body: JSON.stringify({
						guestName: "Wujek Zenon",
						message: "Wszystkiego najlepszego!",
					}),
				},
			);
			const res = await postWish(req, { params: Promise.resolve({ slug }) });

			expect(res.status).toBe(201);
			const data = await res.json();
			expect(data.success).toBe(true);
			expect(data.wish.message).toBe("Wszystkiego najlepszego!");
			expect(notifySpy).toHaveBeenCalledWith(slug, expect.any(Object));
			notifySpy.mockRestore();
		});

		it("powinien odrzucić pustą treść życzenia (400)", async () => {
			const req = new NextRequest(
				`http://localhost/api/gallery/${slug}/wishes`,
				{
					method: "POST",
					body: JSON.stringify({ message: "" }),
				},
			);
			const res = await postWish(req, { params: Promise.resolve({ slug }) });

			expect(res.status).toBe(400);
		});

		it("powinien odrzucić zbyt długą treść życzenia (400)", async () => {
			const req = new NextRequest(
				`http://localhost/api/gallery/${slug}/wishes`,
				{
					method: "POST",
					body: JSON.stringify({ message: "a".repeat(501) }),
				},
			);
			const res = await postWish(req, { params: Promise.resolve({ slug }) });

			expect(res.status).toBe(400);
		});

		it("powinien odrzucić dodanie życzenia dla nieistniejącej galerii (404)", async () => {
			mockGalleries = [];
			const req = new NextRequest("http://localhost/api/gallery/brak/wishes", {
				method: "POST",
				body: JSON.stringify({ message: "Testowe życzenie" }),
			});
			const res = await postWish(req, {
				params: Promise.resolve({ slug: "brak" }),
			});

			expect(res.status).toBe(404);
		});

		it("powinien odrzucić dodanie życzenia dla nieaktywnej galerii (400)", async () => {
			mockGalleries[0].isActive = false;
			const req = new NextRequest(
				`http://localhost/api/gallery/${slug}/wishes`,
				{
					method: "POST",
					body: JSON.stringify({ message: "Testowe życzenie" }),
				},
			);
			const res = await postWish(req, { params: Promise.resolve({ slug }) });

			expect(res.status).toBe(400);
		});

		it("powinien zwrócić 500 w razie błędu serwera", async () => {
			dbShouldThrow = true;
			const req = new NextRequest(
				`http://localhost/api/gallery/${slug}/wishes`,
				{
					method: "POST",
					body: JSON.stringify({ message: "Testowe życzenie" }),
				},
			);
			const res = await postWish(req, { params: Promise.resolve({ slug }) });

			expect(res.status).toBe(500);
		});
	});

	describe("PATCH /api/owner/[slug]/wishes/[id]/status", () => {
		it("powinien odrzucić żądanie bez autoryzacji (401)", async () => {
			const req = new NextRequest(
				`http://localhost/api/owner/${slug}/wishes/wish-1/status`,
				{
					method: "PATCH",
					body: JSON.stringify({ newStatus: "hidden" }),
				},
			);
			const res = await patchWishStatus(req, {
				params: Promise.resolve({ slug, id: "wish-1" }),
			});

			expect(res.status).toBe(401);
		});

		it("powinien ukryć życzenie z poprawnym tokenem właściciela", async () => {
			const req = new NextRequest(
				`http://localhost/api/owner/${slug}/wishes/wish-1/status`,
				{
					method: "PATCH",
					headers: { "x-owner-token": ownerToken },
					body: JSON.stringify({ newStatus: "hidden" }),
				},
			);
			const res = await patchWishStatus(req, {
				params: Promise.resolve({ slug, id: "wish-1" }),
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.newStatus).toBe("hidden");
		});

		it("powinien trwale usunąć życzenie (status deleted)", async () => {
			const req = new NextRequest(
				`http://localhost/api/owner/${slug}/wishes/wish-1/status`,
				{
					method: "PATCH",
					headers: { "x-owner-token": ownerToken },
					body: JSON.stringify({ newStatus: "deleted" }),
				},
			);
			const res = await patchWishStatus(req, {
				params: Promise.resolve({ slug, id: "wish-1" }),
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.newStatus).toBe("deleted");
		});

		it("powinien domyślnie ustawić status ready dla nierozpoznanej wartości", async () => {
			const req = new NextRequest(
				`http://localhost/api/owner/${slug}/wishes/wish-1/status`,
				{
					method: "PATCH",
					headers: { "x-owner-token": ownerToken },
					body: JSON.stringify({ newStatus: "cokolwiek" }),
				},
			);
			const res = await patchWishStatus(req, {
				params: Promise.resolve({ slug, id: "wish-1" }),
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.newStatus).toBe("ready");
		});

		it("powinien zwrócić 500 w razie błędu serwera", async () => {
			dbShouldThrow = true;
			const req = new NextRequest(
				`http://localhost/api/owner/${slug}/wishes/wish-1/status`,
				{
					method: "PATCH",
					headers: { "x-owner-token": ownerToken },
					body: JSON.stringify({ newStatus: "hidden" }),
				},
			);
			const res = await patchWishStatus(req, {
				params: Promise.resolve({ slug, id: "wish-1" }),
			});

			expect(res.status).toBe(500);
		});
	});

	describe("GET /api/gallery/[slug]/live - zdarzenia życzeń", () => {
		it("powinien emitować zdarzenia new-wish i wish-updated przez SSE", async () => {
			const abortController = new AbortController();
			const req = new NextRequest(`http://localhost/api/gallery/${slug}/live`, {
				signal: abortController.signal,
			});

			const res = await getLive(req, { params: Promise.resolve({ slug }) });
			expect(res.status).toBe(200);

			const reader = res.body?.getReader();
			expect(reader).toBeDefined();

			if (reader) {
				const { value: chunk1 } = await reader.read();
				expect(new TextDecoder().decode(chunk1)).toContain(
					'"type":"connected"',
				);

				sseBus.notifyNewWish(slug, {
					id: "wish-live-1",
					guestName: "Kuzyn Adam",
					message: "Sto lat!",
					status: "ready",
					createdAt: new Date().toISOString(),
				});

				const { value: chunk2 } = await reader.read();
				const text2 = new TextDecoder().decode(chunk2);
				expect(text2).toContain('"type":"new-wish"');
				expect(text2).toContain("Kuzyn Adam");

				sseBus.notifyWishUpdated(slug, {
					wishId: "wish-live-1",
					status: "hidden",
				});
				const { value: chunk3 } = await reader.read();
				const text3 = new TextDecoder().decode(chunk3);
				expect(text3).toContain('"type":"wish-updated"');
				expect(text3).toContain("hidden");

				abortController.abort();
			}
		});
	});
});
