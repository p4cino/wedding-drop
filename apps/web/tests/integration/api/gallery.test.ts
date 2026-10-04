import { sseBus } from "@wedding-drop/media";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as authGuest } from "@/app/api/gallery/[slug]/auth/route";
import { GET as getPdf } from "@/app/api/gallery/[slug]/card/pdf/route";
import { GET as getLive } from "@/app/api/gallery/[slug]/live/route";
import { GET as getMedia } from "@/app/api/gallery/[slug]/media/route";
import { GET as getGallery } from "@/app/api/gallery/[slug]/route";
import { GET as getZip } from "@/app/api/gallery/[slug]/zip/route";
import { generateAdminToken, generateOwnerToken } from "@/lib/auth";
import { hashGuestPassword } from "@/lib/guest-password";

let mockExists = true;
const mockGuestPasswordUpdates: Record<string, unknown>[] = [];

vi.mock("node:fs", () => ({
	default: {
		existsSync: vi.fn(() => mockExists),
	},
	existsSync: vi.fn(() => mockExists),
}));

vi.mock("@node-rs/bcrypt", () => ({
	compare: vi.fn((pwd: string) => Promise.resolve(pwd === "sekret123")),
	hash: vi.fn(() => Promise.resolve("hashed")),
}));

vi.mock("archiver", () => {
	const zipArchiveMock = vi.fn().mockImplementation(function (this: unknown) {
		return {
			pipe: vi.fn(),
			file: vi.fn(),
			append: vi.fn(),
			finalize: vi.fn(),
			on: vi.fn(),
		};
	});
	return {
		ZipArchive: zipArchiveMock,
		default: zipArchiveMock,
	};
});

// `createGalleryZipStream` samo w sobie jest już pokryte testami jednostkowymi
// w packages/media/tests/zip-streamer.test.ts (weryfikacja realnych bajtów ZIP
// zawierających zyczenia.txt). Tutaj, na poziomie integracyjnym trasy API,
// interesuje nas wyłącznie to, JAKI `wishesText` trasa zip przekazuje dalej —
// stąd `vi.spyOn` z zachowaniem prawdziwej implementacji (call-through).
import * as mediaModule from "@wedding-drop/media";

const createZipSpy = vi.spyOn(mediaModule, "createGalleryZipStream");

let mockGalleries: Record<string, unknown>[] = [];
let mockCards: Record<string, unknown>[] = [];
let mockMedia: Record<string, unknown>[] = [];
let mockWishesForZip: Record<string, unknown>[] = [];
let dbShouldThrow = false;

import { cardSettings, galleries, wishes } from "@wedding-drop/db";

vi.mock("@wedding-drop/db", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		db: {
			update: vi.fn(() => ({
				set: vi.fn((values: Record<string, unknown>) => {
					mockGuestPasswordUpdates.push(values);
					return { where: vi.fn().mockResolvedValue(undefined) };
				}),
			})),
			select: vi.fn(() => ({
				from: vi.fn((table) => {
					if (dbShouldThrow) throw new Error("DB Error");
					let targetData = mockMedia;
					if (table === galleries) targetData = mockGalleries;
					else if (table === cardSettings) targetData = mockCards;
					else if (table === wishes) targetData = mockWishesForZip;

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
								// biome-ignore lint/suspicious/noThenProperty: Drizzle ORM thenable query mock
								then: (resolve: (val: unknown) => unknown) =>
									resolve(targetData),
							};
						}),
					};
				}),
			})),
		},
	};
});

describe("Gallery API Routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGuestPasswordUpdates.length = 0;
		mockExists = true;
		dbShouldThrow = false;
		mockWishesForZip = [];
		mockGalleries = [
			{
				id: "gal-1",
				slug: "kasia-i-tomek",
				coupleNames: "Kasia & Tomek",
				weddingDate: "2026-09-12",
				ownerPasswordHash: "hashed",
				isActive: true,
				allowGuestDownloads: true,
				allowVideos: true,
				allowGuestUploads: true,
				allowGuestViewing: true,
				isApprovalQueueEnabled: false,
				accessPin: null,
			},
		];
		mockCards = [
			{
				id: "card-1",
				galleryId: "gal-1",
				headline: "Wspomnienia z wesela",
				primaryColor: "#1E293B",
				accentColor: "#D4AF37",
			},
		];
		mockMedia = [
			{
				id: "m-1",
				galleryId: "gal-1",
				uploaderName: "Gość",
				fileType: "image",
				mimeType: "image/jpeg",
				originalFileName: "zabawa.jpg",
				fileSize: 1024,
				storagePath: "galleries/kasia-i-tomek/raw/1.jpg",
				thumbPath: "galleries/kasia-i-tomek/thumbs/1.webp",
				status: "ready",
				createdAt: new Date().toISOString(),
			},
		];
	});

	describe("GET /api/gallery/[slug]", () => {
		it("powinien zwrócić metadane galerii dla istniejącego sluga", async () => {
			const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek");
			const res = await getGallery(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.slug).toBe("kasia-i-tomek");
			expect(data.coupleNames).toBe("Kasia & Tomek");
			expect(data.cardSettings).toBeDefined();
		});

		it("powinien zwrócić null w cardSettings gdy brak konfiguracji winietki", async () => {
			mockCards = [];
			const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek");
			const res = await getGallery(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.cardSettings).toBeNull();
		});

		it("powinien zwrócić kolory motywu z card_settings, gdy galeria ma zapisane ustawienia (dla ramki photobooth)", async () => {
			mockCards = [
				{
					id: "card-1",
					galleryId: "gal-1",
					headline: "Wspomnienia z wesela",
					primaryColor: "#112233",
					accentColor: "#AABBCC",
				},
			];
			const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek");
			const res = await getGallery(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.primaryColor).toBe("#112233");
			expect(data.accentColor).toBe("#AABBCC");
		});

		it("powinien zwrócić domyślne kolory motywu, gdy galeria nie ma zapisanych ustawień winietki", async () => {
			mockCards = [];
			const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek");
			const res = await getGallery(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.primaryColor).toBe("#1E293B");
			expect(data.accentColor).toBe("#D4AF37");
		});

		it("powinien zwrócić 404, gdy galeria nie istnieje", async () => {
			mockGalleries = [];
			const req = new NextRequest("http://localhost/api/gallery/nie-istnieje");
			const res = await getGallery(req, {
				params: Promise.resolve({ slug: "nie-istnieje" }),
			});

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toBe("Galeria nie istnieje");
		});

		it("powinien zwrócić 500 w przypadku błędu serwera", async () => {
			dbShouldThrow = true;
			const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek");
			const res = await getGallery(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(500);
		});
	});

	describe("GET /api/gallery/[slug]/media", () => {
		it("powinien zwrócić listę mediów z prawidłowymi URL-ami", async () => {
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/media",
			);
			const res = await getMedia(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.media).toBeDefined();
			expect(data.media.length).toBeGreaterThan(0);
			expect(data.media[0].thumbUrl).toContain("/media-file/");
		});

		it("powinien odrzucić includeHidden=true bez autoryzacji", async () => {
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/media?includeHidden=true",
			);
			const res = await getMedia(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(401);
			const data = await res.json();
			expect(data.error).toBe(
				"Brak uprawnień do przeglądania ukrytych materiałów",
			);
		});

		it("powinien obsłużyć parametr includeHidden=true z poprawnym nagłówkiem x-owner-password", async () => {
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/media?includeHidden=true",
				{
					headers: { "x-owner-password": "sekret123" },
				},
			);
			const res = await getMedia(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.media).toBeDefined();
		});

		it("powinien obsłużyć parametr includeHidden=true z poprawnym tokenem właściciela (nagłówek i ciasteczko)", async () => {
			const token = generateOwnerToken("kasia-i-tomek");
			const reqHeader = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/media?includeHidden=true",
				{
					headers: { "x-owner-token": token },
				},
			);
			const resHeader = await getMedia(reqHeader, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});
			expect(resHeader.status).toBe(200);

			const reqCookie = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/media?includeHidden=true",
				{
					headers: { cookie: `wd_owner_kasia-i-tomek=${token}` },
				},
			);
			const resCookie = await getMedia(reqCookie, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});
			expect(resCookie.status).toBe(200);
		});

		it("powinien obsłużyć parametr includeHidden=true z poprawnym adminToken przez Authorization: Bearer", async () => {
			const token = generateAdminToken("admin");
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/media?includeHidden=true",
				{
					headers: { authorization: `Bearer ${token}` },
				},
			);
			const res = await getMedia(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.media).toBeDefined();
		});

		it("powinien odrzucić poświadczenia przekazane w query stringu dla includeHidden=true (401)", async () => {
			const adminToken = generateAdminToken("admin");
			const ownerToken = generateOwnerToken("kasia-i-tomek");

			for (const url of [
				"http://localhost/api/gallery/kasia-i-tomek/media?includeHidden=true&password=sekret123",
				`http://localhost/api/gallery/kasia-i-tomek/media?includeHidden=true&adminToken=${adminToken}`,
				`http://localhost/api/gallery/kasia-i-tomek/media?includeHidden=true&ownerToken=${ownerToken}`,
			]) {
				const req = new NextRequest(url);
				const res = await getMedia(req, {
					params: Promise.resolve({ slug: "kasia-i-tomek" }),
				});
				expect(res.status).toBe(401);
			}
		});

		it("powinien zwrócić 404, gdy galeria nie istnieje", async () => {
			mockGalleries = [];
			const req = new NextRequest("http://localhost/api/gallery/brak/media");
			const res = await getMedia(req, {
				params: Promise.resolve({ slug: "brak" }),
			});

			expect(res.status).toBe(404);
		});

		it("powinien zwrócić 500 w razie błędu", async () => {
			dbShouldThrow = true;
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/media",
			);
			const res = await getMedia(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(500);
		});
	});

	describe("GET /api/gallery/[slug]/card/pdf", () => {
		it("powinien zwrócić nagłówek application/pdf", async () => {
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/card/pdf",
			);
			const res = await getPdf(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			expect(res.headers.get("Content-Type")).toBe("application/pdf");
			expect(res.headers.get("Content-Disposition")).toContain(
				"karteczka-stol-kasia-i-tomek.pdf",
			);
		});

		it("powinien zwrócić 404, gdy galeria nie istnieje", async () => {
			mockGalleries = [];
			const req = new NextRequest("http://localhost/api/gallery/brak/card/pdf");
			const res = await getPdf(req, {
				params: Promise.resolve({ slug: "brak" }),
			});

			expect(res.status).toBe(404);
		});
	});

	describe("GET /api/gallery/[slug]/zip", () => {
		it("powinien zwrócić strumień ZIP application/zip", async () => {
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/zip",
			);
			const res = await getZip(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			expect(res.headers.get("Content-Type")).toBe("application/zip");
			expect(res.headers.get("Content-Disposition")).toContain(
				"galeria-kasia-i-tomek",
			);
		});

		it("powinien zablokować pobieranie ZIP, gdy allowGuestDownloads=false bez hasła", async () => {
			mockGalleries[0].allowGuestDownloads = false;
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/zip",
			);
			const res = await getZip(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(403);
		});

		it("powinien zezwolić na pobranie ZIP, gdy allowGuestDownloads=false z poprawnym tokenem właściciela (nagłówek i ciasteczko)", async () => {
			mockGalleries[0].allowGuestDownloads = false;
			const token = generateOwnerToken("kasia-i-tomek");

			const reqHeader = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/zip",
				{
					headers: { "x-owner-token": token },
				},
			);
			const resHeader = await getZip(reqHeader, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});
			expect(resHeader.status).toBe(200);
			expect(resHeader.headers.get("Content-Type")).toBe("application/zip");

			const reqCookie = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/zip",
				{
					headers: { cookie: `wd_owner_kasia-i-tomek=${token}` },
				},
			);
			const resCookie = await getZip(reqCookie, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});
			expect(resCookie.status).toBe(200);
			expect(resCookie.headers.get("Content-Type")).toBe("application/zip");
		});

		it("powinien zezwolić na pobranie ZIP, gdy allowGuestDownloads=false z poprawnym nagłówkiem x-owner-password", async () => {
			mockGalleries[0].allowGuestDownloads = false;
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/zip",
				{
					headers: { "x-owner-password": "sekret123" },
				},
			);
			const res = await getZip(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			expect(res.headers.get("Content-Type")).toBe("application/zip");
		});

		it("powinien zablokować pobranie ZIP (403), gdy allowGuestDownloads=false a poświadczenia podano tylko w query (?password= lub ?token=)", async () => {
			mockGalleries[0].allowGuestDownloads = false;
			const token = generateOwnerToken("kasia-i-tomek");

			const reqPwd = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/zip?password=sekret123",
			);
			const resPwd = await getZip(reqPwd, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});
			expect(resPwd.status).toBe(403);

			const reqToken = new NextRequest(
				`http://localhost/api/gallery/kasia-i-tomek/zip?token=${token}`,
			);
			const resToken = await getZip(reqToken, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});
			expect(resToken.status).toBe(403);
		});

		it("powinien zablokować pobieranie ZIP gdy galeria ma accessPin i podano błędny lub brak PIN", async () => {
			mockGalleries[0].accessPin = "4321";
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/zip",
			);
			const res = await getZip(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});
			expect(res.status).toBe(401);
		});

		it("powinien zezwolić na pobranie ZIP gdy galeria ma accessPin i podano poprawny PIN", async () => {
			mockGalleries[0].accessPin = "4321";
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/zip",
				{
					headers: { "x-access-pin": "4321" },
				},
			);
			const res = await getZip(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});
			expect(res.status).toBe(200);
		});

		it("powinien zwrócić 404, gdy galeria nie istnieje", async () => {
			mockGalleries = [];
			const req = new NextRequest("http://localhost/api/gallery/brak/zip");
			const res = await getZip(req, {
				params: Promise.resolve({ slug: "brak" }),
			});

			expect(res.status).toBe(404);
		});

		it("powinien zwrócić 400, gdy brak zdjęć w galerii", async () => {
			mockMedia = [];
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/zip",
			);
			const res = await getZip(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(400);
		});

		it("powinien zwrócić 404, gdy pliki fizyczne nie istnieją na dysku", async () => {
			mockExists = false;
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/zip",
			);
			const res = await getZip(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(404);
			expect(await res.json()).toEqual({
				error: "Pliki fizyczne nie zostały znalezione na dysku",
			});
		});

		it("powinien zwrócić 500 w razie błędu serwera", async () => {
			dbShouldThrow = true;
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/zip",
			);
			const res = await getZip(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(500);
		});

		it("powinien dołączyć plik z życzeniami do archiwum, gdy galeria ma widoczne życzenia", async () => {
			mockWishesForZip = [
				{
					id: "wish-1",
					galleryId: "gal-1",
					guestName: "Ciocia Kasia",
					message: "Sto lat!",
					status: "ready",
					createdAt: new Date().toISOString(),
				},
			];

			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/zip",
			);
			const res = await getZip(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			expect(createZipSpy).toHaveBeenCalledWith(
				expect.any(Array),
				expect.any(String),
				expect.stringContaining("Sto lat!"),
			);
		});

		it("powinien zezwolić na pobranie ZIP zawierającego wyłącznie życzenia, gdy brak zdjęć", async () => {
			mockMedia = [];
			mockWishesForZip = [
				{
					id: "wish-1",
					galleryId: "gal-1",
					guestName: null,
					message: "Wszystkiego najlepszego!",
					status: "ready",
					createdAt: new Date().toISOString(),
				},
			];

			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/zip",
			);
			const res = await getZip(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			expect(createZipSpy).toHaveBeenCalledWith(
				expect.any(Array),
				expect.any(String),
				expect.stringContaining("Wszystkiego najlepszego!"),
			);
		});

		it("nie powinien przekazać wishesText, gdy galeria nie ma żadnych widocznych życzeń", async () => {
			mockWishesForZip = [];
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/zip",
			);
			const res = await getZip(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			expect(createZipSpy).toHaveBeenCalledWith(
				expect.any(Array),
				expect.any(String),
				undefined,
			);
		});
	});

	describe("GET /api/gallery/[slug]/live", () => {
		it("powinien otworzyć strumień text/event-stream i obsługiwać powiadomienia oraz rozłączenie", async () => {
			const abortController = new AbortController();
			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/live",
				{
					signal: abortController.signal,
				},
			);

			const res = await getLive(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});
			expect(res.status).toBe(200);
			expect(res.headers.get("Content-Type")).toContain("text/event-stream");

			const reader = res.body?.getReader();
			expect(reader).toBeDefined();

			if (reader) {
				// 1. Pierwszy chunk - connected
				const { value: chunk1 } = await reader.read();
				const text1 = new TextDecoder().decode(chunk1);
				expect(text1).toContain('"type":"connected"');

				// 2. Emisja zdarzenia sseBus
				sseBus.notifyNewMedia("kasia-i-tomek", {
					id: "new-sse-media",
					uploaderName: "Kuzyn Paweł",
					fileType: "image",
					mimeType: "image/jpeg",
					originalFileName: "taniec.jpg",
					fileSize: 2048,
					thumbPath: "galleries/kasia-i-tomek/thumbs/t.webp",
					storagePath: "galleries/kasia-i-tomek/raw/t.jpg",
					createdAt: new Date().toISOString(),
				});

				const { value: chunk2 } = await reader.read();
				const text2 = new TextDecoder().decode(chunk2);
				expect(text2).toContain('"type":"new-media"');
				expect(text2).toContain("Kuzyn Paweł");

				// 3. Rozłączenie - trigger abort
				abortController.abort();
			}
		});
	});

	describe("POST /api/gallery/[slug]/auth", () => {
		it("powinien autoryzować gościa jeśli hasło jest poprawne", async () => {
			mockGalleries[0].guestPassword = "haslo_dla_gosci";

			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/auth",
				{
					method: "POST",
					body: JSON.stringify({ password: "haslo_dla_gosci" }),
				},
			);
			const res = await authGuest(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			const cookie = res.headers.get("Set-Cookie");
			expect(cookie).toContain("wd_guest_kasia-i-tomek=");
			// Hasło zapisane jawnie (legacy) zostaje przehaszowane po udanym logowaniu
			expect(mockGuestPasswordUpdates).toHaveLength(1);
			expect(mockGuestPasswordUpdates[0].guestPassword).toMatch(/^scrypt\$/);
		});

		it("powinien autoryzować gościa dla hasła zapisanego jako scrypt", async () => {
			mockGalleries[0].guestPassword = hashGuestPassword("haslo_dla_gosci");

			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/auth",
				{
					method: "POST",
					body: JSON.stringify({ password: "haslo_dla_gosci" }),
				},
			);
			const res = await authGuest(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(200);
			expect(mockGuestPasswordUpdates).toHaveLength(0);
		});

		it("powinien zwrócić 401 jeśli hasło jest niepoprawne", async () => {
			mockGalleries[0].guestPassword = "haslo_dla_gosci";

			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/auth",
				{
					method: "POST",
					body: JSON.stringify({ password: "zle_haslo" }),
				},
			);
			const res = await authGuest(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(401);
		});

		it("powinien zwrócić 400 jeśli galeria nie wymaga hasła", async () => {
			mockGalleries[0].guestPassword = null;

			const req = new NextRequest(
				"http://localhost/api/gallery/kasia-i-tomek/auth",
				{
					method: "POST",
					body: JSON.stringify({ password: "haslo_dla_gosci" }),
				},
			);
			const res = await authGuest(req, {
				params: Promise.resolve({ slug: "kasia-i-tomek" }),
			});

			expect(res.status).toBe(400);
		});
	});
});
