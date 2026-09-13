import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as googleCallbackGet } from "@/app/api/auth/google/callback/route";
import { GET as googleAuthGet } from "@/app/api/auth/google/route";
import { generateOwnerToken } from "@/lib/auth";

let mockGalleryList: unknown[] = [];
let isConfigured = true;

vi.mock("@wedding-drop/media", () => ({
	isGoogleDriveConfigured: vi.fn(() => isConfigured),
	getGoogleAuthUrl: vi.fn(
		(slug) => `https://accounts.google.com/oauth?slug=${slug}`,
	),
	verifySignedState: vi.fn((state) => {
		if (state === "valid-state") return { slug: "kasia-i-tomek" };
		return null;
	}),
	exchangeCodeForTokens: vi.fn((code) => {
		if (code === "bad-code") throw new Error("Exchange failed");
		return Promise.resolve({
			tokens: { refresh_token: "mock-refresh-token" },
			email: "couple@wedding.com",
		});
	}),
}));

vi.mock("bcryptjs", () => ({
	default: {
		compare: vi.fn((pwd, _hash) => Promise.resolve(pwd === "correct_password")),
	},
}));

vi.mock("@wedding-drop/db", () => {
	return {
		db: {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn().mockImplementation(() =>
								Promise.resolve(
									// biome-ignore lint/suspicious/noExplicitAny: test mock
									mockGalleryList.map((g: any) => ({
										gallery: g,
										gdrive: g.gdriveRefreshToken
											? {
													refreshToken: g.gdriveRefreshToken,
													accountEmail: g.gdriveAccountEmail,
													exportStatus: g.gdriveExportStatus,
												}
											: null,
									})),
								),
							),
						})),
					})),
					where: vi.fn(() => ({
						limit: vi
							.fn()
							.mockImplementation(() => Promise.resolve(mockGalleryList)),
					})),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn().mockResolvedValue([]),
				})),
			})),
			insert: vi.fn(() => ({
				values: vi.fn().mockResolvedValue([]),
			})),
		},
		galleries: {
			id: "galleries.id",
			slug: "galleries.slug",
		},
		galleryGdriveExports: {
			galleryId: "gallery_gdrive_exports.gallery_id",
		},
	};
});

describe("Google OAuth API Routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		isConfigured = true;
		mockGalleryList = [
			{
				id: "gal-123",
				slug: "kasia-i-tomek",
				ownerPasswordHash: "$2a$10$hashedpassword",
				gdriveExportStatus: "idle",
			},
		];
	});

	describe("GET /api/auth/google", () => {
		it("powinien zwrócić 503, gdy Google Drive nie jest skonfigurowany w środowisku", async () => {
			isConfigured = false;
			const req = new NextRequest(
				"http://localhost:3000/api/auth/google?slug=kasia-i-tomek",
			);
			const res = await googleAuthGet(req);

			expect(res.status).toBe(503);
			const data = await res.json();
			expect(data.error).toContain("Google Drive nie jest skonfigurowany");
		});

		it("powinien zwrócić 400, gdy brak parametru slug lub poświadczeń", async () => {
			const req = new NextRequest("http://localhost:3000/api/auth/google");
			const res = await googleAuthGet(req);

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toContain("Wymagany jest slug");
		});

		it("powinien zwrócić 401, gdy podano nieprawidłowy token właściciela", async () => {
			const req = new NextRequest(
				"http://localhost:3000/api/auth/google?slug=kasia-i-tomek&token=invalid-token",
			);
			const res = await googleAuthGet(req);

			expect(res.status).toBe(401);
		});

		it("powinien przekierować do URL logowania Google przy poprawnym tokenie właściciela", async () => {
			const token = generateOwnerToken("kasia-i-tomek");
			const req = new NextRequest(
				`http://localhost:3000/api/auth/google?slug=kasia-i-tomek&token=${token}`,
			);
			const res = await googleAuthGet(req);

			expect(res.status).toBe(307);
			expect(res.headers.get("location")).toContain(
				"https://accounts.google.com/oauth",
			);
		});

		it("powinien obsłużyć autoryzację hasłem (404 gdy galeria nie istnieje, 401 przy złym haśle, 307 przy dobrym)", async () => {
			// 404 - galeria nie istnieje
			mockGalleryList = [];
			const reqMissing = new NextRequest(
				"http://localhost:3000/api/auth/google?slug=brak&password=correct_password",
			);
			const resMissing = await googleAuthGet(reqMissing);
			expect(resMissing.status).toBe(404);

			// 401 - złe hasło
			mockGalleryList = [
				{ id: "g-1", slug: "kasia-i-tomek", ownerPasswordHash: "hash" },
			];
			const reqWrong = new NextRequest(
				"http://localhost:3000/api/auth/google?slug=kasia-i-tomek&password=zle_haslo",
			);
			const resWrong = await googleAuthGet(reqWrong);
			expect(resWrong.status).toBe(401);

			// 307 - poprawne hasło
			const reqCorrect = new NextRequest(
				"http://localhost:3000/api/auth/google?slug=kasia-i-tomek&password=correct_password",
			);
			const resCorrect = await googleAuthGet(reqCorrect);
			expect(resCorrect.status).toBe(307);
		});
	});

	describe("GET /api/auth/google/callback", () => {
		it("powinien obsłużyć anulowanie logowania przez użytkownika (parametr error)", async () => {
			const req = new NextRequest(
				"http://localhost:3000/api/auth/google/callback?error=access_denied",
			);
			const res = await googleCallbackGet(req);

			expect(res.status).toBe(307);
			expect(res.headers.get("location")).toContain(
				"gdrive_error=access_denied",
			);
		});

		it("powinien przekierować z błędem gdy brak parametru state lub code", async () => {
			const req = new NextRequest(
				"http://localhost:3000/api/auth/google/callback?code=some-code",
			);
			const res = await googleCallbackGet(req);

			expect(res.status).toBe(307);
			expect(res.headers.get("location")).toContain(
				"gdrive_error=missing_parameters",
			);
		});

		it("powinien odrzucić nieprawidłowy lub przeterminowany podpis HMAC parametru state", async () => {
			const req = new NextRequest(
				"http://localhost:3000/api/auth/google/callback?code=some-code&state=tampered-state",
			);
			const res = await googleCallbackGet(req);

			expect(res.status).toBe(307);
			expect(res.headers.get("location")).toContain(
				"gdrive_error=invalid_or_expired_state",
			);
		});

		it("powinien obsłużyć błąd gdy galeria ze stanu nie istnieje w bazie danych", async () => {
			mockGalleryList = [];
			const req = new NextRequest(
				"http://localhost:3000/api/auth/google/callback?code=valid-code&state=valid-state",
			);
			const res = await googleCallbackGet(req);

			expect(res.status).toBe(307);
			expect(res.headers.get("location")).toContain(
				"gdrive_error=gallery_not_found",
			);
		});

		it("powinien pomyślnie wymienić kod na tokeny, zapisać w bazie i przekierować do panelu", async () => {
			const req = new NextRequest(
				"http://localhost:3000/api/auth/google/callback?code=valid-code&state=valid-state",
			);
			const res = await googleCallbackGet(req);

			expect(res.status).toBe(307);
			expect(res.headers.get("location")).toContain(
				"/owner/kasia-i-tomek?gdrive=connected",
			);
		});

		it("powinien obsłużyć błąd wymiany kodu i przekierować z parametrem błędu", async () => {
			const req = new NextRequest(
				"http://localhost:3000/api/auth/google/callback?code=bad-code&state=valid-state",
			);
			const res = await googleCallbackGet(req);

			expect(res.status).toBe(307);
			expect(res.headers.get("location")).toContain(
				"gdrive_error=Exchange%20failed",
			);
		});
	});
});
