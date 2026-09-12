import crypto from "node:crypto";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	checkStorageQuota,
	ensureDriveFolder,
	exchangeCodeForTokens,
	generateSignedState,
	getDriveClientForGallery,
	getGoogleAuthUrl,
	getOAuth2Client,
	isGoogleDriveConfigured,
	uploadFileToDrive,
	verifySignedState,
} from "../src/google-drive";
import { sseBus } from "../src/sse-bus";

// Mock googleapis
vi.mock("googleapis", () => {
	class MockOAuth2 {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		credentials: Record<string, unknown> = {};

		constructor(clientId: string, clientSecret: string, redirectUri: string) {
			this.clientId = clientId;
			this.clientSecret = clientSecret;
			this.redirectUri = redirectUri;
		}

		generateAuthUrl(opts: Record<string, unknown>) {
			return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&state=${opts.state}&access_type=${opts.access_type}`;
		}

		async getToken(code: string) {
			if (code === "invalid-code") {
				throw new Error("Invalid grant");
			}
			return {
				tokens: {
					access_token: "mock-access-token",
					refresh_token: "mock-refresh-token",
					expiry_date: Date.now() + 3600000,
				},
			};
		}

		setCredentials(creds: Record<string, unknown>) {
			this.credentials = creds;
		}
	}

	return {
		google: {
			auth: {
				OAuth2: MockOAuth2,
			},
			oauth2: vi.fn().mockReturnValue({
				userinfo: {
					get: vi.fn().mockResolvedValue({
						data: { email: "wedding.couple@gmail.com" },
					}),
				},
			}),
			drive: vi.fn().mockReturnValue({
				about: {
					get: vi.fn().mockResolvedValue({
						data: {
							storageQuota: {
								limit: "15000000000",
								usage: "5000000000",
							},
						},
					}),
				},
				files: {
					list: vi.fn().mockResolvedValue({
						data: { files: [] },
					}),
					create: vi.fn().mockResolvedValue({
						data: { id: "new-created-folder-or-file-id" },
					}),
				},
			}),
		},
	};
});

describe("Google Drive Helper & Security Tests", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
		process.env.GOOGLE_CLIENT_ID = "test-client-id";
		process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
		process.env.APP_DOMAIN = "http://localhost:3000";
		vi.clearAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("OAuth2 Client Initialization & URL Generation", () => {
		it("powinien rzucić błąd gdy brak konfiguracji GOOGLE_CLIENT_ID lub SECRET", () => {
			delete process.env.GOOGLE_CLIENT_ID;
			delete process.env.GOOGLE_CLIENT_SECRET;
			expect(() => getOAuth2Client()).toThrow(/Brak konfiguracji Google OAuth/);
		});

		it("powinien utworzyć klienta OAuth2 z domyślnym oraz niestandardowym adresem redirectUri", () => {
			const client1 = getOAuth2Client();
			expect(client1).toBeDefined();

			const customUri = "https://custom.wedding-drop.pl/callback";
			const client2 = getOAuth2Client(customUri);
			expect(client2).toBeDefined();
		});

		it("powinien poprawnie wygenerować URL autoryzacyjny Google z offline refresh_token i stanem state", () => {
			const slug = "kasia-i-tomek";
			const url = getGoogleAuthUrl(slug);

			expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
			expect(url).toContain("state=");
			expect(url).toContain("access_type=offline");
		});

		it("powinien wymienić kod na tokeny i pobrać email użytkownika", async () => {
			const res = await exchangeCodeForTokens("valid-auth-code");
			expect(res.tokens.refresh_token).toBe("mock-refresh-token");
			expect(res.email).toBe("wedding.couple@gmail.com");
		});

		it("powinien obsłużyć błąd pobierania emaila z userinfo i zwrócić email: null", async () => {
			const { google } = await import("googleapis");
			vi.mocked(google.oauth2).mockReturnValueOnce({
				userinfo: {
					get: vi
						.fn()
						.mockRejectedValueOnce(new Error("Userinfo fetch failed")),
				},
			} as unknown as ReturnType<typeof google.oauth2>);

			const res = await exchangeCodeForTokens("valid-code-no-email");
			expect(res.tokens).toBeDefined();
			expect(res.email).toBeNull();
		});

		it("powinien zwrócić klienta drive dla galerii za pomocą refresh_token", () => {
			const drive = getDriveClientForGallery("existing-refresh-token");
			expect(drive).toBeDefined();
			expect(drive.files).toBeDefined();
		});
	});

	describe("Pre-flight Quota Check", () => {
		it("powinien poprawnie obliczyć dostępne bajty na podstawie storageQuota", async () => {
			const { google } = await import("googleapis");
			const mockDrive = google.drive({ version: "v3" });

			const quota = await checkStorageQuota(mockDrive);
			expect(quota.limitBytes).toBe(15000000000);
			expect(quota.usageBytes).toBe(5000000000);
			expect(quota.freeBytes).toBe(10000000000);
		});

		it("powinien zwrócić Infinity gdy storageQuota nie posiada limitu (konto nielimitowane/Google Workspace)", async () => {
			const { google } = await import("googleapis");
			const mockDrive = google.drive({ version: "v3" });
			vi.mocked(mockDrive.about.get).mockResolvedValueOnce({
				data: { storageQuota: {} },
			} as unknown as Awaited<ReturnType<typeof mockDrive.about.get>>);

			const quota = await checkStorageQuota(mockDrive);
			expect(quota.limitBytes).toBe(Infinity);
			expect(quota.freeBytes).toBe(Infinity);
		});

		it("powinien bezpiecznie obsłużyć błąd zapytania about.get i zwrócić bezpieczne wartości fallback", async () => {
			const { google } = await import("googleapis");
			const mockDrive = google.drive({ version: "v3" });
			vi.mocked(mockDrive.about.get).mockRejectedValueOnce(
				new Error("API Quota exceeded"),
			);

			const quota = await checkStorageQuota(mockDrive);
			expect(quota.limitBytes).toBe(Infinity);
			expect(quota.freeBytes).toBe(Infinity);
		});
	});

	describe("ensureDriveFolder", () => {
		it("powinien zwrócić istniejący folder ID, gdy folder o podanej nazwie już istnieje", async () => {
			const { google } = await import("googleapis");
			const mockDrive = google.drive({ version: "v3" });
			vi.mocked(mockDrive.files.list).mockResolvedValueOnce({
				data: { files: [{ id: "existing-folder-id", name: "Zdjęcia" }] },
			} as unknown as Awaited<ReturnType<typeof mockDrive.files.list>>);

			const folderId = await ensureDriveFolder(
				mockDrive,
				"Zdjęcia",
				"parent-123",
			);
			expect(folderId).toBe("existing-folder-id");
		});

		it("powinien utworzyć nowy folder, gdy nie istnieje", async () => {
			const { google } = await import("googleapis");
			const mockDrive = google.drive({ version: "v3" });
			vi.mocked(mockDrive.files.list).mockResolvedValueOnce({
				data: { files: [] },
			} as unknown as Awaited<ReturnType<typeof mockDrive.files.list>>);

			vi.mocked(mockDrive.files.create).mockResolvedValueOnce({
				data: { id: "created-folder-xyz" },
			} as unknown as Awaited<ReturnType<typeof mockDrive.files.create>>);

			const folderId = await ensureDriveFolder(
				mockDrive,
				"Filmy",
				"parent-123",
			);
			expect(folderId).toBe("created-folder-xyz");
		});

		it("powinien rzucić błąd gdy utworzenie folderu nie zwróci ID", async () => {
			const { google } = await import("googleapis");
			const mockDrive = google.drive({ version: "v3" });
			vi.mocked(mockDrive.files.list).mockResolvedValueOnce({
				data: { files: [] },
			} as unknown as Awaited<ReturnType<typeof mockDrive.files.list>>);

			vi.mocked(mockDrive.files.create).mockResolvedValueOnce({
				data: {},
			} as unknown as Awaited<ReturnType<typeof mockDrive.files.create>>);

			await expect(
				ensureDriveFolder(mockDrive, "Błędny Folder"),
			).rejects.toThrow(/Nie udało się utworzyć folderu/);
		});
	});

	describe("uploadFileToDrive", () => {
		it("powinien przesłać plik na Google Drive i zwrócić ID", async () => {
			const { google } = await import("googleapis");
			const mockDrive = google.drive({ version: "v3" });

			const createReadStreamSpy = vi
				.spyOn(fs, "createReadStream")
				.mockReturnValue({} as unknown as fs.ReadStream);

			vi.mocked(mockDrive.files.create).mockResolvedValueOnce({
				data: { id: "uploaded-file-id" },
			} as unknown as Awaited<ReturnType<typeof mockDrive.files.create>>);

			const id = await uploadFileToDrive(
				mockDrive,
				"/data/uploads/sample.jpg",
				"sample.jpg",
				"image/jpeg",
				"folder-target-id",
				1,
			);

			expect(id).toBe("uploaded-file-id");
			createReadStreamSpy.mockRestore();
		});

		it("powinien natychmiast rzucić błąd o braku miejsca przy błędzie storageQuotaExceeded 403", async () => {
			const { google } = await import("googleapis");
			const mockDrive = google.drive({ version: "v3" });

			const createReadStreamSpy = vi
				.spyOn(fs, "createReadStream")
				.mockReturnValue({} as unknown as fs.ReadStream);

			vi.mocked(mockDrive.files.create).mockRejectedValueOnce({
				code: 403,
				message: "storageQuotaExceeded",
			});

			await expect(
				uploadFileToDrive(
					mockDrive,
					"/data/uploads/big.mp4",
					"big.mp4",
					"video/mp4",
					"folder-target-id",
					2,
				),
			).rejects.toThrow(/Brak miejsca na Twoim koncie Google Drive/);

			createReadStreamSpy.mockRestore();
		});
	});

	describe("Kryptograficzny stan HMAC (State Security)", () => {
		it("powinien wygenerować i poprawnie zweryfikować podpisany stan state", () => {
			process.env.ADMIN_PASSWORD = "test-secret-key-456";
			const slug = "ania-i-bartek";

			const state = generateSignedState(slug);
			expect(typeof state).toBe("string");
			expect(state.length).toBeGreaterThan(20);

			const verified = verifySignedState(state);
			expect(verified).not.toBeNull();
			expect(verified?.slug).toBe(slug);
		});

		it("powinien odrzucić stan ze zmodyfikowanym payloadem (tampered HMAC)", () => {
			process.env.ADMIN_PASSWORD = "test-secret-key-456";
			const slug = "kasia-i-tomek";

			const state = generateSignedState(slug);
			const raw = Buffer.from(state, "base64url").toString("utf8");
			const parsed = JSON.parse(raw);

			const fakePayload = JSON.stringify({
				slug: "hacked-slug",
				ts: Date.now(),
				nonce: "123",
			});
			parsed.payload = Buffer.from(fakePayload).toString("base64url");
			const tamperedState = Buffer.from(JSON.stringify(parsed)).toString(
				"base64url",
			);

			const verified = verifySignedState(tamperedState);
			expect(verified).toBeNull();
		});

		it("powinien odrzucić przeterminowany stan (>15 minut)", () => {
			process.env.ADMIN_PASSWORD = "test-secret-key-456";
			const secret = "test-secret-key-456";

			const oldTimestamp = Date.now() - 20 * 60 * 1000;
			const payload = JSON.stringify({
				slug: "test-slug",
				ts: oldTimestamp,
				nonce: "abc",
			});
			const hmac = crypto
				.createHmac("sha256", secret)
				.update(payload)
				.digest("hex");
			const stateObj = {
				payload: Buffer.from(payload).toString("base64url"),
				hmac,
			};
			const expiredState = Buffer.from(JSON.stringify(stateObj)).toString(
				"base64url",
			);

			const verified = verifySignedState(expiredState);
			expect(verified).toBeNull();
		});

		it("powinien zwrócić null przy uszkodzonym lub niepoprawnym formacie stanu", () => {
			expect(verifySignedState("invalid-base64url-payload")).toBeNull();
		});
	});

	describe("Weryfikacja konfiguracji środowiska", () => {
		it("powinien zwrócić false, gdy brak zmiennych GOOGLE_CLIENT_ID lub SECRET", () => {
			delete process.env.GOOGLE_CLIENT_ID;
			delete process.env.GOOGLE_CLIENT_SECRET;
			expect(isGoogleDriveConfigured()).toBe(false);

			process.env.GOOGLE_CLIENT_ID = "some-id";
			delete process.env.GOOGLE_CLIENT_SECRET;
			expect(isGoogleDriveConfigured()).toBe(false);
		});

		it("powinien zwrócić true, gdy obie zmienne są zdefiniowane", () => {
			process.env.GOOGLE_CLIENT_ID = "mock-id.apps.googleusercontent.com";
			process.env.GOOGLE_CLIENT_SECRET = "mock-secret";
			expect(isGoogleDriveConfigured()).toBe(true);
		});
	});

	describe("Emisja zdarzeń SSE dla postępu Google Drive", () => {
		it("powinien emitować zdarzenie gdrive-progress dla właściwego wesela", () => {
			const slug = "natalia-i-lukasz";
			const callback = vi.fn();

			sseBus.on(`gdrive-progress:${slug}`, callback);

			const progressData = {
				status: "running" as const,
				processedFiles: 12,
				totalFiles: 50,
				currentFile: "IMG_0042.jpg",
			};

			sseBus.notifyGDriveProgress(slug, progressData);

			expect(callback).toHaveBeenCalledTimes(1);
			expect(callback).toHaveBeenCalledWith(progressData);

			sseBus.off(`gdrive-progress:${slug}`, callback);
		});
	});
});
