import { expect, test } from "@playwright/test";

test.describe("Panel Pary Młodej (Właściciela)", () => {
	test("UC1: powinien umożliwić logowanie hasłem i wyświetlić panel zarządzania", async ({
		page,
	}) => {
		await page.goto("/owner/kasia-i-tomek");

		// Ekran logowania
		await expect(page.getByText("Panel Pary Młodej")).toBeVisible();
		const passwordInput = page.getByPlaceholder("Wpisz hasło dostępu");
		await expect(passwordInput).toBeVisible();

		// Podanie hasła i zatwierdzenie
		await passwordInput.fill("sekret123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		// Po zalogowaniu widok dashboardu
		await expect(
			page.getByText("Zarządzanie galerią, eksport i moderacja treści"),
		).toBeVisible();
		await expect(page.getByText("Zajęte miejsce")).toBeVisible();
		await expect(page.getByText("Zdjęcia", { exact: true })).toBeVisible();
		await expect(page.getByText("Filmy", { exact: true })).toBeVisible();
	});

	test("UC2: powinien odrzucić błędne hasło właściciela i wyświetlić błąd", async ({
		page,
	}) => {
		await page.goto("/owner/kasia-i-tomek");

		const passwordInput = page.getByPlaceholder("Wpisz hasło dostępu");
		await passwordInput.fill("calkowicie_bledne_haslo");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		await expect(page.getByText("Nieprawidłowe hasło")).toBeVisible();
		await expect(
			page.getByText("Zarządzanie galerią, eksport i moderacja treści"),
		).not.toBeVisible();
	});

	test("UC3: powinien wygenerować link do pobrania ZIP zawierający bezpieczny token właściciela", async ({
		page,
	}) => {
		await page.goto("/owner/kasia-i-tomek");
		await page.getByPlaceholder("Wpisz hasło dostępu").fill("sekret123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		await expect(
			page.getByText("Zarządzanie galerią, eksport i moderacja treści"),
		).toBeVisible();

		// Przycisk pobierania ZIP — link zawiera podpisany token HMAC (nie hasło w URL,
		// zgodnie z regułą bezpieczeństwa z AGENTS.md), więc dopasowujemy wzorzec zamiast
		// stałego ciągu (token zawiera znacznik czasu i jest inny przy każdym logowaniu)
		const zipBtn = page.getByRole("link", {
			name: /Pobierz ZIP/i,
		});
		await expect(zipBtn).toBeVisible();
		await expect(zipBtn).toHaveAttribute(
			"href",
			/^\/api\/gallery\/kasia-i-tomek\/zip\?token=owner_\d+_[A-Za-z0-9%]+_[a-f0-9]+$/,
		);
	});

	test("UC4: powinien umożliwić moderację widoczności zdjęcia (ukryj / pokaż)", async ({
		page,
	}) => {
		// Podstawienie przykładowych multimediów przez route handler dla powtarzalnego testu UI
		await page.route("**/api/gallery/kasia-i-tomek/media*", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					media: [
						{
							id: "foto-1",
							uploaderName: "Świadek Jan",
							fileType: "image",
							originalFileName: "toast.jpg",
							fileSize: 1024000,
							thumbUrl:
								"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='gold'/></svg>",
							rawUrl: "#",
							status: "ready",
							createdAt: "2026-09-12T12:00:00.000Z",
						},
					],
				}),
			});
		});

		await page.goto("/owner/kasia-i-tomek");
		await page.getByPlaceholder("Wpisz hasło dostępu").fill("sekret123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		await expect(page.getByText("Świadek Jan")).toBeVisible();

		// Kliknięcie ikony ukrywania (Oko)
		const toggleBtn = page.getByTitle("Ukryj przed gośćmi");
		await expect(toggleBtn).toBeVisible();

		// Przechwycenie żądania toggle-status
		await page.route("**/api/owner/**", async (route) => {
			const method = route.request().method();
			let action = "";
			try {
				action = route.request().postDataJSON()?.action;
			} catch (_e) {}

			if (method === "PATCH" || action === "toggle-status") {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ success: true }),
				});
			} else {
				await route.continue();
			}
		});

		await toggleBtn.click();

		// Po ukryciu pojawia się plakietka 'Ukryte' i ikona zmienia się na 'Pokaż w galerii'
		await expect(page.getByText("Ukryte", { exact: true })).toBeVisible();
		await expect(page.getByTitle("Pokaż w galerii")).toBeVisible();
	});

	test("UC5: powinien poprawnie filtrować multimedia (wszystkie / widoczne / ukryte)", async ({
		page,
	}) => {
		await page.route("**/api/gallery/kasia-i-tomek/media*", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					media: [
						{
							id: "foto-ready",
							uploaderName: "Ciocia Ania",
							fileType: "image",
							originalFileName: "kwiaty.jpg",
							fileSize: 204800,
							thumbUrl:
								"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='pink'/></svg>",
							rawUrl: "#",
							status: "ready",
							createdAt: "2026-09-12T12:00:00.000Z",
						},
						{
							id: "foto-hidden",
							uploaderName: "Kuzyn Tomek",
							fileType: "image",
							originalFileName: "wpadka.jpg",
							fileSize: 512000,
							thumbUrl:
								"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='gray'/></svg>",
							rawUrl: "#",
							status: "hidden",
							createdAt: "2026-09-12T12:05:00.000Z",
						},
					],
				}),
			});
		});

		await page.goto("/owner/kasia-i-tomek");
		await page.getByPlaceholder("Wpisz hasło dostępu").fill("sekret123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		// Domyślnie widok 'Wszystkie (2)'
		await expect(page.getByText("Ciocia Ania")).toBeVisible();
		await expect(page.getByText("Kuzyn Tomek")).toBeVisible();

		// Filtruj do 'Widoczne (1)'
		await page.getByRole("button", { name: /Widoczne/i }).click();
		await expect(page.getByText("Ciocia Ania")).toBeVisible();
		await expect(page.getByText("Kuzyn Tomek")).not.toBeVisible();

		// Filtruj do 'Ukryte (1)'
		await page.getByRole("button", { name: /Ukryte/i }).click();
		await expect(page.getByText("Ciocia Ania")).not.toBeVisible();
		await expect(page.getByText("Kuzyn Tomek")).toBeVisible();
	});

	test("UC6: powinien umożliwić usunięcie zdjęcia z listy mediów po potwierdzeniu dialogu", async ({
		page,
	}) => {
		await page.route("**/api/gallery/kasia-i-tomek/media*", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					media: [
						{
							id: "foto-del",
							uploaderName: "Do Skasowania",
							fileType: "image",
							originalFileName: "zle_zdjecie.jpg",
							fileSize: 100000,
							thumbUrl:
								"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='red'/></svg>",
							rawUrl: "#",
							status: "ready",
							createdAt: "2026-09-12T12:00:00.000Z",
						},
					],
				}),
			});
		});

		await page.goto("/owner/kasia-i-tomek");
		await page.getByPlaceholder("Wpisz hasło dostępu").fill("sekret123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();
		await expect(page.getByText("Do Skasowania")).toBeVisible();

		// Przechwycenie akcji usunięcia
		await page.route("**/api/owner/**", async (route) => {
			const method = route.request().method();
			let action = "";
			try {
				action = route.request().postDataJSON()?.action;
			} catch (_e) {}

			if (method === "DELETE" || action === "delete-media") {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ success: true }),
				});
			} else {
				await route.continue();
			}
		});

		// Akceptacja dialogu
		page.once("dialog", async (dialog) => {
			await dialog.accept();
		});

		await page.getByTitle("Usuń bezpowrotnie").click();
		await expect(page.getByText("Do Skasowania")).not.toBeVisible();
	});

	test("UC7: powinien zawierać bezpośredni link nawigacyjny do projektanta winietek A6", async ({
		page,
	}) => {
		await page.goto("/owner/kasia-i-tomek");
		await page.getByPlaceholder("Wpisz hasło dostępu").fill("sekret123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		const cardLink = page.getByRole("link", { name: /Karteczka A6/i });
		await expect(cardLink).toBeVisible();
		// next-intl (localePrefix: "always") dodaje prefiks lokalizacji nawet dla domyślnej "pl"
		await expect(cardLink).toHaveAttribute("href", "/pl/g/kasia-i-tomek/card");
	});

	test("UC8: ukrycie zdjęcia przez Parę Młodą zmniejsza wynik danego gościa w rankingu galerii", async ({
		browser,
	}) => {
		// Wspólny, mutowalny stan multimediów widziany zarówno przez panel właściciela
		// (włącznie z ukrytymi), jak i przez galerię gościa (tylko status "ready") —
		// symuluje to, co w produkcji robi backend po wywołaniu toggle-status.
		const mediaList = [
			{
				id: "rank-1",
				uploaderName: "Świadek Jan",
				fileType: "image",
				originalFileName: "a.jpg",
				fileSize: 100000,
				thumbUrl: "#",
				rawUrl: "#",
				status: "ready",
				createdAt: "2026-09-12T12:00:00.000Z",
			},
			{
				id: "rank-2",
				uploaderName: "Świadek Jan",
				fileType: "image",
				originalFileName: "b.jpg",
				fileSize: 100000,
				thumbUrl: "#",
				rawUrl: "#",
				status: "ready",
				createdAt: "2026-09-12T12:01:00.000Z",
			},
		];

		const ownerContext = await browser.newContext();
		const ownerPage = await ownerContext.newPage();

		await ownerPage.route(
			"**/api/gallery/kasia-i-tomek/media*",
			async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ media: mediaList }),
				});
			},
		);

		// Przechwycenie akcji ukrycia — mutuje wspólny stan `mediaList`
		await ownerPage.route("**/api/owner/**", async (route) => {
			const method = route.request().method();
			let action = "";
			try {
				action = route.request().postDataJSON()?.action;
			} catch (_e) {}

			if (method === "PATCH" || action === "toggle-status") {
				const item = mediaList.find((m) => m.id === "rank-2");
				if (item) item.status = "hidden";
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ success: true }),
				});
			} else {
				await route.continue();
			}
		});

		await ownerPage.goto("/owner/kasia-i-tomek");
		await ownerPage.getByPlaceholder("Wpisz hasło dostępu").fill("sekret123");
		await ownerPage.getByRole("button", { name: "Zaloguj się" }).click();
		await expect(ownerPage.getByText("Świadek Jan").first()).toBeVisible();

		// Widok gościa PRZED ukryciem: dwa materiały Świadka Jana w rankingu
		const guestContext = await browser.newContext();
		const guestPage = await guestContext.newPage();
		await guestPage.route(
			"**/api/gallery/kasia-i-tomek/media",
			async (route) => {
				const visible = mediaList.filter((m) => m.status === "ready");
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ media: visible }),
				});
			},
		);
		await guestPage.goto("/g/kasia-i-tomek");

		const leaderboard = guestPage.getByRole("region", {
			name: "Najaktywniejsi goście",
		});
		await expect(leaderboard).toBeVisible();
		await expect(leaderboard).toContainText("Świadek Jan");
		await expect(leaderboard).toContainText("2 materiałów");

		// Właściciel ukrywa jeden z dwóch materiałów Świadka Jana
		const toggleButtons = ownerPage.getByTitle("Ukryj przed gośćmi");
		await toggleButtons.last().click();
		await expect(ownerPage.getByTitle("Pokaż w galerii")).toBeVisible();

		// Odświeżenie widoku gościa: wynik Świadka Jana w rankingu spadł o jeden
		await guestPage.reload();
		await expect(leaderboard).toContainText("Świadek Jan");
		await expect(leaderboard).toContainText("1 materiałów");
		await expect(leaderboard).not.toContainText("2 materiałów");

		await ownerContext.close();
		await guestContext.close();
	});
});
