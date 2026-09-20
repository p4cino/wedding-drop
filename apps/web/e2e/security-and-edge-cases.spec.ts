import { expect, test } from "@playwright/test";

test.describe("Bezpieczeństwo i Przypadki Brzegowe (Security & Edge Cases)", () => {
	test("UC1: zapytanie o ukryte zdjęcia bez autoryzacji powinno zwrócić 401 Unauthorized", async ({
		request,
	}) => {
		const res = await request.get(
			"/api/gallery/kasia-i-tomek/media?includeHidden=true",
		);
		expect(res.status()).toBe(401);

		const body = await res.json();
		expect(body.error).toContain("Brak uprawnień");
	});

	test("UC2: zapytanie o nieistniejącą galerię w widoku gościa powinno wyświetlić elegancki ekran 404", async ({
		page,
	}) => {
		await page.goto("/g/nieistniejacy-slug-galerii-999");

		await expect(
			page.getByText("Galeria nie została znaleziona"),
		).toBeVisible();
		await expect(
			page.getByText("Upewnij się, że adres URL lub kod QR jest prawidłowy."),
		).toBeVisible();

		const homeBtn = page.getByRole("link", { name: "Strona główna" });
		await expect(homeBtn).toBeVisible();
		await expect(homeBtn).toHaveAttribute("href", "/");
	});

	test("UC3: próba Directory Traversal w /media-file/* powinna zostać zablokowana przez sandbox", async ({
		request,
	}) => {
		// Próba odpytania o plik wykraczający poza sandbox /app/data
		const res = await request.get("/media-file/..%2F..%2Fpackage.json");
		// Serwer powinien odrzucić zapytanie kodem 400 lub 403
		expect([400, 403, 404]).toContain(res.status());
	});

	test("UC4: żądanie pobrania ZIP dla pustej galerii powinno zwrócić 400 z komunikatem", async ({
		request,
	}) => {
		const loginRes = await request.post("/api/admin/auth", {
			data: { username: "admin", password: "admin123" },
		});
		const { adminToken } = await loginRes.json();
		const emptySlug = `empty-${Date.now().toString().slice(-6)}`;
		const createRes = await request.post("/api/admin/galleries", {
			headers: { "x-admin-token": adminToken },
			data: {
				coupleNames: "Pusta Galeria",
				weddingDate: "2026-12-31",
				ownerEmail: "empty@example.com",
				ownerPassword: "haslo",
				customSlug: emptySlug,
			},
		});
		const createData = await createRes.json();

		const res = await request.get(`/api/gallery/${emptySlug}/zip`);
		expect(res.status()).toBe(400);
		const body = await res.json();
		expect(body.error).toContain("Brak zdjęć do pobrania");

		// Sprzątanie po teście
		await request.delete(`/api/admin/galleries/${createData.gallery.id}`, {
			headers: { "x-admin-token": adminToken },
		});
	});

	test("UC5: akcja administracyjna z sfałszowanym tokenem powinna zwrócić 401", async ({
		request,
	}) => {
		const res = await request.get("/api/admin/galleries", {
			headers: {
				"x-admin-token":
					"admin_1720000000000_YWRtaW4=_niepoprawny_podpis_hmac_12345",
			},
		});

		expect(res.status()).toBe(401);
		const data = await res.json();
		expect(data.error).toContain("Brak uprawnień administratora");
	});

	test("UC6: panel właściciela powinien poprawnie obsługiwać próbę dostępu do nieistniejącej galerii", async ({
		request,
	}) => {
		const res = await request.post(
			"/api/owner/calkowicie-nieistniejaca-galeria/auth",
			{
				data: {
					password: "dowolne-haslo",
				},
			},
		);

		expect(res.status()).toBe(404);
		const data = await res.json();
		expect(data.error).toContain("Galeria nie istnieje");
	});

	test("UC7: tworzenie wesela z niebezpiecznym slugiem (znaki specjalne i ../) powinno zostać bezpiecznie oczyszczone", async ({
		request,
	}) => {
		const loginRes = await request.post("/api/admin/auth", {
			data: { username: "admin", password: "admin123" },
		});
		const { adminToken } = await loginRes.json();

		const createRes = await request.post("/api/admin/galleries", {
			headers: { "x-admin-token": adminToken },
			data: {
				coupleNames: "Bezpieczna Para",
				weddingDate: "2026-11-20",
				ownerEmail: "safe@example.com",
				ownerPassword: "haslo",
				customSlug: "zly slug!@# z path/../",
			},
		});

		expect(createRes.status()).toBe(400);
		const createData = await createRes.json();
		expect(createData.error).toContain(
			"Slug może zawierać wyłącznie małe litery",
		);
	});

	test("UC8: dedykowane endpointy RESTful (GET, POST, DELETE) powinny poprawnie obsługiwać cykl życia zasobów", async ({
		request,
	}) => {
		// Logowanie REST POST /api/admin/auth
		const loginRes = await request.post("/api/admin/auth", {
			data: { username: "admin", password: "admin123" },
		});
		expect(loginRes.status()).toBe(200);
		const { adminToken } = await loginRes.json();

		// Tworzenie galerii REST POST /api/admin/galleries (status 201)
		const restSlug = `rest-${Date.now().toString().slice(-6)}`;
		const createRes = await request.post("/api/admin/galleries", {
			headers: { "x-admin-token": adminToken },
			data: {
				coupleNames: "REST Para",
				weddingDate: "2026-10-15",
				ownerEmail: "rest@example.com",
				ownerPassword: "haslo",
				customSlug: restSlug,
			},
		});
		expect(createRes.status()).toBe(201);
		const createData = await createRes.json();

		// Pobranie listy galerii REST GET /api/admin/galleries
		const listRes = await request.get("/api/admin/galleries", {
			headers: { "x-admin-token": adminToken },
		});
		expect(listRes.status()).toBe(200);
		const listData = await listRes.json();
		expect(
			listData.galleries.some((g: { slug: string }) => g.slug === restSlug),
		).toBe(true);

		// Logowanie pary młodej REST POST /api/owner/[slug]/auth
		const ownerAuthRes = await request.post(`/api/owner/${restSlug}/auth`, {
			data: { password: "haslo" },
		});
		expect(ownerAuthRes.status()).toBe(200);
		const ownerAuthData = await ownerAuthRes.json();
		expect(ownerAuthData.ownerToken).toBeDefined();
		expect(ownerAuthData.ownerToken.startsWith("owner_")).toBe(true);

		// Usunięcie galerii REST DELETE /api/admin/galleries/[id]
		const deleteRes = await request.delete(
			`/api/admin/galleries/${createData.gallery.id}`,
			{
				headers: { "x-admin-token": adminToken },
			},
		);
		expect(deleteRes.status()).toBe(200);
	});
});
