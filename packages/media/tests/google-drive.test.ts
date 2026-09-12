import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	generateSignedState,
	isGoogleDriveConfigured,
	verifySignedState,
} from "../src/google-drive.js";
import { sseBus } from "../src/sse-bus.js";

describe("Google Drive Helper & Security Tests", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
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

			// Podmiana sluga bez zmiany podpisu HMAC
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

			// Stan sprzed 20 minut
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
