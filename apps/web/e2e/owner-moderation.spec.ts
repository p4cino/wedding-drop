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

	test("UC3: powinien wygenerować bezpieczny link do pobrania ZIP bez poświadczeń w URL", async ({
		page,
	}) => {
		await page.goto("/owner/kasia-i-tomek");
		await page.getByPlaceholder("Wpisz hasło dostępu").fill("sekret123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		await expect(
			page.getByText("Zarządzanie galerią, eksport i moderacja treści"),
		).toBeVisible();

		// Przycisk pobierania ZIP nie powinien zawierać tokenu ani hasła w URL
		const zipBtn = page.getByRole("link", {
			name: /Pobierz ZIP/i,
		});
		await expect(zipBtn).toBeVisible();
		await expect(zipBtn).toHaveAttribute(
			"href",
			"/api/gallery/kasia-i-tomek/zip",
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
		// Filtry zdjęć i życzeń mają te same etykiety — zawężamy do grupy filtrów multimediów
		const mediaFilters = page.getByRole("group", {
			name: "Filtrowanie multimediów",
		});
		await mediaFilters.getByRole("button", { name: /Widoczne/i }).click();
		await expect(page.getByText("Ciocia Ania")).toBeVisible();
		await expect(page.getByText("Kuzyn Tomek")).not.toBeVisible();

		// Filtruj do 'Ukryte (1)'
		await mediaFilters.getByRole("button", { name: /Ukryte/i }).click();
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

	test("UC8: powinien umożliwić moderację widoczności życzenia (ukryj / pokaż)", async ({
		page,
	}) => {
		await page.route("**/api/gallery/kasia-i-tomek/media*", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ media: [] }),
			});
		});

		await page.route("**/api/gallery/kasia-i-tomek/wishes*", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					wishes: [
						{
							id: "wish-1",
							guestName: "Świadek Jan",
							message: "Sto lat i szczęścia!",
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

		await expect(page.getByText("Sto lat i szczęścia!")).toBeVisible();

		const toggleBtn = page.getByTitle("Ukryj przed gośćmi");
		await expect(toggleBtn).toBeVisible();

		await page.route("**/api/owner/**", async (route) => {
			const method = route.request().method();
			if (method === "PATCH") {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ success: true, newStatus: "hidden" }),
				});
			} else {
				await route.continue();
			}
		});

		await toggleBtn.click();

		await expect(page.getByText("Ukryte", { exact: true })).toBeVisible();
		await expect(page.getByTitle("Pokaż w księdze")).toBeVisible();
	});

	test("UC9: powinien umożliwić trwałe usunięcie życzenia z księgi po potwierdzeniu dialogu", async ({
		page,
	}) => {
		await page.route("**/api/gallery/kasia-i-tomek/media*", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ media: [] }),
			});
		});

		await page.route("**/api/gallery/kasia-i-tomek/wishes*", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					wishes: [
						{
							id: "wish-del",
							guestName: null,
							message: "Życzenie do skasowania",
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
		await expect(page.getByText("Życzenie do skasowania")).toBeVisible();

		await page.route("**/api/owner/**", async (route) => {
			const method = route.request().method();
			if (method === "PATCH") {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ success: true, newStatus: "deleted" }),
				});
			} else {
				await route.continue();
			}
		});

		page.once("dialog", async (dialog) => {
			await dialog.accept();
		});

		await page.getByTitle("Usuń bezpowrotnie").click();
		await expect(page.getByText("Życzenie do skasowania")).not.toBeVisible();
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

	test("UC8: import fotografa bez poprawnego tokenu właściciela powinien zostać odrzucony przez serwer TUS (401)", async ({
		request,
	}) => {
		// Prawdziwe żądanie utworzenia uploadu TUS (protokół tus 1.0.0) do rzeczywistego backendu -
		// weryfikuje, że onUploadCreate w packages/media/src/tus-server.ts odrzuca import fotografa
		// bez wstrzykniętej, poprawnej autoryzacji właściciela, zanim jakikolwiek plik trafi na dysk.
		const encodeMeta = (value: string) =>
			Buffer.from(value, "utf-8").toString("base64");

		const metadataNoToken = [
			`gallerySlug ${encodeMeta("kasia-i-tomek")}`,
			`source ${encodeMeta("photographer")}`,
			`originalName ${encodeMeta("sesja-bez-tokenu.jpg")}`,
			`fileType ${encodeMeta("image/jpeg")}`,
		].join(",");

		const resNoToken = await request.post("/api/upload/tus", {
			headers: {
				"Tus-Resumable": "1.0.0",
				"Upload-Length": "1000",
				"Upload-Metadata": metadataNoToken,
			},
		});
		expect(resNoToken.status()).toBe(401);

		const metadataWrongToken = [
			`gallerySlug ${encodeMeta("kasia-i-tomek")}`,
			`source ${encodeMeta("photographer")}`,
			`ownerToken ${encodeMeta("owner_1_ZmFrZQ==_totalnie-zly-hmac")}`,
			`originalName ${encodeMeta("sesja-zly-token.jpg")}`,
			`fileType ${encodeMeta("image/jpeg")}`,
		].join(",");

		const resWrongToken = await request.post("/api/upload/tus", {
			headers: {
				"Tus-Resumable": "1.0.0",
				"Upload-Length": "1000",
				"Upload-Metadata": metadataWrongToken,
			},
		});
		expect(resWrongToken.status()).toBe(401);
	});

	test("UC9: powinien umożliwić import fotografa po zalogowaniu i wyświetlić odróżniającą odznakę źródła w galerii", async ({
		page,
	}) => {
		// Symulacja odpowiedzi galerii po pomyślnym imporcie fotografa - potwierdza, że panel importu
		// jest dostępny po zalogowaniu właściciela i że materiały source: "photographer" otrzymują
		// odróżniającą odznakę w siatce moderacji (patrz MediaGridWithModeration.tsx).
		await page.route("**/api/gallery/kasia-i-tomek/media*", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					media: [
						{
							id: "foto-gosc",
							uploaderName: "Ciocia Ania",
							source: "guest",
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
							id: "foto-fotograf",
							uploaderName: "Fotograf Jan Kowalski",
							source: "photographer",
							fileType: "image",
							originalFileName: "sesja-plenerowa.jpg",
							fileSize: 4096000,
							thumbUrl:
								"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='goldenrod'/></svg>",
							rawUrl: "#",
							status: "ready",
							createdAt: "2026-09-12T13:00:00.000Z",
						},
					],
				}),
			});
		});

		await page.goto("/owner/kasia-i-tomek");
		await page.getByPlaceholder("Wpisz hasło dostępu").fill("sekret123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		// Sekcja importu fotografa jest widoczna wyłącznie po zalogowaniu właściciela
		await expect(
			page.getByText("Importuj zdjęcia/filmy fotografa"),
		).toBeVisible();

		// Materiał gościa nie ma odznaki źródła fotografa
		await expect(page.getByText("Ciocia Ania")).toBeVisible();

		// Materiał fotografa w siatce moderacji ma odróżniającą odznakę
		await expect(page.getByText("Fotograf Jan Kowalski")).toBeVisible();
		await expect(page.getByText("Fotograf", { exact: true })).toBeVisible();
	});

	test("UC11: powinien odtworzyć sesję po przeładowaniu strony i nie zapisywać poświadczeń w sessionStorage", async ({
		page,
	}) => {
		await page.goto("/owner/kasia-i-tomek");
		await page.getByPlaceholder("Wpisz hasło dostępu").fill("sekret123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		await expect(
			page.getByText("Zarządzanie galerią, eksport i moderacja treści"),
		).toBeVisible();

		// Sprawdzenie, że ani hasło ani token nie są zapisane w sessionStorage ani localStorage
		const storageData = await page.evaluate(() => {
			return {
				pwd: sessionStorage.getItem("owner_pwd_kasia-i-tomek"),
				token: sessionStorage.getItem("owner_token_kasia-i-tomek"),
				localPwd: localStorage.getItem("owner_pwd_kasia-i-tomek"),
				localToken: localStorage.getItem("owner_token_kasia-i-tomek"),
			};
		});
		expect(storageData.pwd).toBeNull();
		expect(storageData.token).toBeNull();
		expect(storageData.localPwd).toBeNull();
		expect(storageData.localToken).toBeNull();

		// Przeładowanie strony - sesja powinna zostać odtworzona z ciasteczka HttpOnly
		await page.reload();
		await expect(
			page.getByText("Zarządzanie galerią, eksport i moderacja treści"),
		).toBeVisible();
		await expect(
			page.getByPlaceholder("Wpisz hasło dostępu"),
		).not.toBeVisible();
	});

	test("UC12: powinien wysłać POST do /api/auth/google i przekierować na zwrócony authUrl", async ({
		page,
	}) => {
		let postCalled = false;
		let requestMethod = "";
		let requestUrl = "";
		let requestBody: Record<string, unknown> | null = null;
		let tokenHeader: string | null = null;

		await page.route("**/api/owner/kasia-i-tomek/auth", async (route) => {
			const res = await route.fetch();
			const data = await res.json();
			await route.fulfill({
				status: res.status(),
				headers: res.headers(),
				body: JSON.stringify({ ...data, isGDriveConfigured: true }),
			});
		});

		await page.route("**/api/auth/google", async (route) => {
			postCalled = true;
			requestMethod = route.request().method();
			requestUrl = route.request().url();
			requestBody = route.request().postDataJSON();
			tokenHeader = route.request().headers()["x-owner-token"] || null;

			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					authUrl:
						"https://accounts.google.com/o/oauth2/v2/auth?state=mock-state",
				}),
			});
		});

		// Blokujemy przejście na obcą domenę google.com, aby test nie zawisł
		await page.route("https://accounts.google.com/**", async (route) => {
			await route.abort();
		});

		await page.goto("/owner/kasia-i-tomek");
		await page.getByPlaceholder("Wpisz hasło dostępu").fill("sekret123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		await expect(
			page.getByText("Zarządzanie galerią, eksport i moderacja treści"),
		).toBeVisible();

		const connectBtn = page.getByRole("button", {
			name: /Połącz z Google Drive/i,
		});
		await expect(connectBtn).toBeVisible();
		await connectBtn.click();

		await expect.poll(() => postCalled).toBe(true);
		expect(requestMethod).toBe("POST");
		expect(requestUrl).not.toContain("token=");
		expect(requestUrl).not.toContain("password=");
		expect(requestBody).toEqual({ slug: "kasia-i-tomek" });
		expect(tokenHeader).toBeTruthy();
	});

	test("UC13: powinien umożliwić wylogowanie z panelu i usunąć sesję", async ({
		page,
	}) => {
		await page.goto("/owner/kasia-i-tomek");
		await page.getByPlaceholder("Wpisz hasło dostępu").fill("sekret123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		await expect(
			page.getByText("Zarządzanie galerią, eksport i moderacja treści"),
		).toBeVisible();

		// Kliknięcie przycisku 'Wyloguj'
		const logoutBtn = page.getByRole("button", { name: /Wyloguj/i });
		await expect(logoutBtn).toBeVisible();
		await logoutBtn.click();

		// Powrót do formularza logowania
		await expect(page.getByPlaceholder("Wpisz hasło dostępu")).toBeVisible();
		await expect(
			page.getByText("Zarządzanie galerią, eksport i moderacja treści"),
		).not.toBeVisible();

		// Po przeładowaniu sesja nie istnieje, formularz hasła nadal widoczny
		await page.reload();
		await expect(page.getByPlaceholder("Wpisz hasło dostępu")).toBeVisible();
	});

	test("UC14: powinien odtworzyć istniejącą sesję przy wejściu z parametrem ?gdrive=connected", async ({
		page,
	}) => {
		await page.goto("/owner/kasia-i-tomek");
		await page.getByPlaceholder("Wpisz hasło dostępu").fill("sekret123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		await expect(
			page.getByText("Zarządzanie galerią, eksport i moderacja treści"),
		).toBeVisible();

		// Symulacja powrotu z Google OAuth do panelu z parametrem ?gdrive=connected
		await page.goto("/owner/kasia-i-tomek?gdrive=connected");

		// Sesja powinna zostać pomyślnie odtworzona z ciasteczka HttpOnly
		await expect(
			page.getByText("Zarządzanie galerią, eksport i moderacja treści"),
		).toBeVisible();
		await expect(
			page.getByText("Dysk Google został pomyślnie podłączony"),
		).toBeVisible();
	});
});
