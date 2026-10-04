import { expect, test } from "@playwright/test";

/**
 * Galeria chroniona hasłem gościa nie ujawnia mediów ani życzeń bez sesji gościa.
 * Test na poziomie API (bez UI), na galerii demo `kasia-i-tomek` (hasło właściciela `sekret123`).
 */
const SLUG = "kasia-i-tomek";
const OWNER_PASSWORD = "sekret123";
const GUEST_PASSWORD = "haslo-gosci-e2e";

test.describe("Hasło gościa - kontrola dostępu do API", () => {
	test("media i życzenia wymagają sesji gościa, po zalogowaniu działają", async ({
		playwright,
		baseURL,
	}) => {
		const owner = await playwright.request.newContext({
			baseURL,
			ignoreHTTPSErrors: true,
		});
		const guest = await playwright.request.newContext({
			baseURL,
			ignoreHTTPSErrors: true,
		});

		const login = await owner.post(`/api/owner/${SLUG}/auth`, {
			data: { password: OWNER_PASSWORD },
		});
		expect(login.ok()).toBeTruthy();
		const { ownerToken } = await login.json();
		const ownerHeaders = { "x-owner-token": ownerToken };

		try {
			const set = await owner.patch(`/api/owner/${SLUG}/settings`, {
				headers: ownerHeaders,
				data: { guestPassword: GUEST_PASSWORD },
			});
			expect(set.ok()).toBeTruthy();

			// Bez sesji gościa
			expect((await guest.get(`/api/gallery/${SLUG}/media`)).status()).toBe(
				401,
			);
			expect((await guest.get(`/api/gallery/${SLUG}/wishes`)).status()).toBe(
				401,
			);
			const meta = await guest.get(`/api/gallery/${SLUG}`);
			expect(await meta.json()).not.toHaveProperty("id");

			// Po zalogowaniu hasłem gościa (ciasteczko w kontekście)
			const auth = await guest.post(`/api/gallery/${SLUG}/auth`, {
				data: { password: GUEST_PASSWORD },
			});
			expect(auth.ok()).toBeTruthy();
			expect((await guest.get(`/api/gallery/${SLUG}/media`)).status()).toBe(
				200,
			);
			expect((await guest.get(`/api/gallery/${SLUG}/wishes`)).status()).toBe(
				200,
			);
		} finally {
			await owner.patch(`/api/owner/${SLUG}/settings`, {
				headers: ownerHeaders,
				data: { guestPassword: null },
			});
			await owner.dispose();
			await guest.dispose();
		}
	});
});
