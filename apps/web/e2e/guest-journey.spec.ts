import { expect, test } from "@playwright/test";

const MOCK_MEDIA = [
	{
		id: "media-1",
		uploaderName: "Wujek Staszek",
		fileType: "image" as const,
		mimeType: "image/jpeg",
		originalFileName: "pierwszy_taniec.jpg",
		fileSize: 1024000,
		thumbUrl:
			"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='goldenrod'/><text x='20' y='100' fill='white'>Foto 1</text></svg>",
		rawUrl:
			"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='800' height='600' fill='goldenrod'/></svg>",
		createdAt: "2026-09-12T15:00:00.000Z",
	},
	{
		id: "media-2",
		uploaderName: "Ciocia Halinka",
		fileType: "image" as const,
		mimeType: "image/jpeg",
		originalFileName: "tort_weselny.jpg",
		fileSize: 2048000,
		thumbUrl:
			"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='darkred'/><text x='20' y='100' fill='white'>Foto 2</text></svg>",
		rawUrl:
			"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='800' height='600' fill='darkred'/></svg>",
		createdAt: "2026-09-12T15:30:00.000Z",
	},
];

test.describe("Ścieżka Gościa Weselnego (Mobile & Desktop)", () => {
	test("UC1: powinien załadować widok galerii gościa z nagłówkiem i statystykami", async ({
		page,
	}) => {
		await page.goto("/g/kasia-i-tomek");

		// Weryfikacja nagłówka ślubnego
		await expect(page.locator("h1")).toContainText("Kasia & Tomek");
		await expect(page.getByText(/Wspomnienia z Wesela/i)).toBeVisible();
		await expect(page.getByText(/2026-09-12/i)).toBeVisible();

		// Sprawdzenie, że nie ma odnośnika do karteczki na stół w nagłówku gościa (zgodnie z poprawkami UX)
		const cardLink = page.getByRole("link", { name: /Karteczka na stół/i });
		await expect(cardLink).not.toBeVisible();

		// Pływający przycisk dodawania zdjęć
		const uploadBtn = page.getByRole("button", {
			name: /Dodaj zdjęcia i filmy/i,
		});
		await expect(uploadBtn).toBeVisible();
	});

	test("UC2: powinien wyświetlić czytelny stan pusty, gdy w galerii nie ma jeszcze zdjęć", async ({
		page,
	}) => {
		await page.route("**/api/gallery/kasia-i-tomek/media", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ media: [] }),
			});
		});

		await page.goto("/g/kasia-i-tomek");
		await expect(page.getByText("Brak zdjęć w tej galerii")).toBeVisible();
		await expect(
			page.getByText("Bądź pierwszą osobą, która coś doda!"),
		).toBeVisible();
	});

	test("UC3: powinien otworzyć drawer uploadu, umożliwić wpisanie podpisu i zamknąć go", async ({
		page,
	}) => {
		await page.goto("/g/kasia-i-tomek");

		// Otwarcie drawera
		await page.getByRole("button", { name: /Dodaj zdjęcia i filmy/i }).click();

		// Weryfikacja widoku drawera
		await expect(
			page.getByRole("heading", { name: "Dodaj zdjęcia i filmy" }),
		).toBeVisible();
		await expect(
			page.getByText("Bez logowania • Zostaną zapisane w galerii"),
		).toBeVisible();

		// Podpis gościa
		const nameInput = page.getByPlaceholder("np. Ciocia Kasia i Wujek Michał");
		await expect(nameInput).toBeVisible();
		await nameInput.fill("Wujek Zdzisław i Ciocia Maryla");
		await expect(nameInput).toHaveValue("Wujek Zdzisław i Ciocia Maryla");

		// Weryfikacja strefy wyboru plików i ukrytego pola file input
		await expect(
			page.getByText("Kliknij, aby wybrać z galerii lub aparatu"),
		).toBeVisible();
		const fileInput = page.locator(
			'input[type="file"][accept="image/*,video/*"]',
		);
		await expect(fileInput).toBeAttached();

		// Zamknięcie drawera przyciskiem X
		const closeBtn = page.getByRole("button", { name: /zamknij/i });
		await closeBtn.click();
		await expect(
			page.getByText("Bez logowania • Zostaną zapisane w galerii"),
		).not.toBeVisible();
	});

	test("UC4: powinien wyrenderować siatkę ze zdjęciami i podpisami autorów", async ({
		page,
	}) => {
		await page.route("**/api/gallery/kasia-i-tomek/media", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ media: MOCK_MEDIA }),
			});
		});

		await page.goto("/g/kasia-i-tomek");

		// Weryfikacja kafelków w siatce
		await expect(page.locator("main").getByText("Wujek Staszek")).toBeVisible();
		await expect(
			page.locator("main").getByText("Ciocia Halinka"),
		).toBeVisible();

		// Weryfikacja licznika zdjęć w nagłówku
		await expect(page.getByText("2 zdjęć")).toBeVisible();
	});

	test("UC5: powinien otworzyć pełnoekranowy Lightbox i nawigować przyciskami oraz klawiaturą", async ({
		page,
	}) => {
		await page.route("**/api/gallery/kasia-i-tomek/media", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ media: MOCK_MEDIA }),
			});
		});

		await page.goto("/g/kasia-i-tomek");

		// Kliknięcie pierwszego zdjęcia
		await page.locator("main").getByText("Wujek Staszek").click();

		// Weryfikacja otwarcia Lightboxa
		await expect(page.getByText("1 z 2", { exact: true })).toBeVisible();
		await expect(
			page.getByText("pierwszy_taniec.jpg", { exact: true }),
		).toBeVisible();

		// Nawigacja klawiaturą: Strzałka w prawo -> zdjęcie 2
		await page.keyboard.press("ArrowRight");
		await expect(page.getByText("2 z 2", { exact: true })).toBeVisible();
		await expect(
			page.getByText("tort_weselny.jpg", { exact: true }),
		).toBeVisible();

		// Nawigacja klawiaturą: Strzałka w lewo -> powrót do zdjęcia 1
		await page.keyboard.press("ArrowLeft");
		await expect(page.getByText("1 z 2", { exact: true })).toBeVisible();
		await expect(
			page.getByText("pierwszy_taniec.jpg", { exact: true }),
		).toBeVisible();

		// Zamknięcie klawiszem Escape
		await page.keyboard.press("Escape");
		await expect(page.getByText("1 z 2")).not.toBeVisible();
	});

	test("UC6: powinien obsługiwać gesty dotykowe Swipe (przesuwanie palcem) w Lightboxie", async ({
		page,
	}) => {
		await page.route("**/api/gallery/kasia-i-tomek/media", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ media: MOCK_MEDIA }),
			});
		});

		await page.goto("/g/kasia-i-tomek");
		await page.locator("main").getByText("Wujek Staszek").click();
		await expect(page.getByText("1 z 2", { exact: true })).toBeVisible();

		// 1. Symulacja Swipe w lewo (przesunięcie palca z 300px do 100px -> diff > 45px -> Następne zdjęcie)
		await page.evaluate(() => {
			const el = document.querySelector('[role="dialog"]') as HTMLElement;
			const fire = (type: string, x: number) => {
				const ev = new CustomEvent(type, { bubbles: true });
				Object.defineProperty(ev, "targetTouches", {
					value: [{ clientX: x, clientY: 200 }],
				});
				el.dispatchEvent(ev);
			};
			fire("touchstart", 300);
			fire("touchmove", 100);
			fire("touchend", 100);
		});

		// Powinno przejść do zdjęcia nr 2
		await expect(page.getByText("2 z 2", { exact: true })).toBeVisible();
		await expect(
			page.getByText("tort_weselny.jpg", { exact: true }),
		).toBeVisible();

		// 2. Symulacja Swipe w prawo (przesunięcie palca z 100px do 300px -> diff < -45px -> Poprzednie zdjęcie)
		await page.evaluate(() => {
			const el = document.querySelector('[role="dialog"]') as HTMLElement;
			const fire = (type: string, x: number) => {
				const ev = new CustomEvent(type, { bubbles: true });
				Object.defineProperty(ev, "targetTouches", {
					value: [{ clientX: x, clientY: 200 }],
				});
				el.dispatchEvent(ev);
			};
			fire("touchstart", 100);
			fire("touchmove", 300);
			fire("touchend", 300);
		});

		// Powrót do zdjęcia nr 1
		await expect(page.getByText("1 z 2", { exact: true })).toBeVisible();
		await expect(
			page.getByText("pierwszy_taniec.jpg", { exact: true }),
		).toBeVisible();
	});

	test("UC8: powinien umożliwić dodanie życzenia z księgi gości i wyświetlić je natychmiast na liście", async ({
		page,
	}) => {
		let wishesStore: Array<{
			id: string;
			guestName: string | null;
			message: string;
			createdAt: string;
		}> = [];

		await page.route("**/api/gallery/kasia-i-tomek/wishes", async (route) => {
			const method = route.request().method();
			if (method === "POST") {
				const body = route.request().postDataJSON();
				const newWish = {
					id: `wish-${wishesStore.length + 1}`,
					guestName: body.guestName || null,
					message: body.message,
					createdAt: new Date().toISOString(),
				};
				wishesStore = [newWish, ...wishesStore];
				await route.fulfill({
					status: 201,
					contentType: "application/json",
					body: JSON.stringify({ success: true, wish: newWish }),
				});
			} else {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ wishes: wishesStore }),
				});
			}
		});

		await page.goto("/g/kasia-i-tomek");

		// Przejście na zakładkę Życzenia
		await page.getByRole("tab", { name: /Życzenia/i }).click();
		await expect(
			page.getByText("Księga życzeń czeka na pierwsze wpisy"),
		).toBeVisible();

		// Wypełnienie formularza życzenia
		await page
			.getByPlaceholder("np. Ciocia Kasia i Wujek Michał")
			.fill("Ciocia Zosia");
		await page
			.getByPlaceholder("Napisz kilka ciepłych słów dla Pary Młodej...")
			.fill("Sto lat i samych szczęśliwych dni!");

		await page.getByRole("button", { name: /Wyślij życzenia/i }).click();

		// Życzenie powinno pojawić się natychmiast na liście
		await expect(
			page.getByText("Sto lat i samych szczęśliwych dni!"),
		).toBeVisible();
		await expect(page.getByText("Ciocia Zosia")).toBeVisible();
	});

	test("UC9: przycisk wysyłania życzenia powinien być zablokowany, dopóki treść jest pusta", async ({
		page,
	}) => {
		await page.route("**/api/gallery/kasia-i-tomek/wishes", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ wishes: [] }),
			});
		});

		await page.goto("/g/kasia-i-tomek");
		await page.getByRole("tab", { name: /Życzenia/i }).click();

		const submitBtn = page.getByRole("button", { name: /Wyślij życzenia/i });
		await expect(submitBtn).toBeDisabled();

		await page
			.getByPlaceholder("Napisz kilka ciepłych słów dla Pary Młodej...")
			.fill("Wszystkiego najlepszego!");
		await expect(submitBtn).toBeEnabled();
	});

	test("UC7: powinien zawierać przycisk pobierania pojedynczego zdjęcia z Lightboxa", async ({
		page,
	}) => {
		await page.route("**/api/gallery/kasia-i-tomek/media", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ media: MOCK_MEDIA }),
			});
		});

		await page.goto("/g/kasia-i-tomek");
		await page.locator("main").getByText("Wujek Staszek").click();

		// Przycisk pobierania pliku
		const downloadBtn = page.getByTitle("Pobierz oryginalny plik");
		await expect(downloadBtn).toBeVisible();
		await expect(downloadBtn).toHaveAttribute(
			"download",
			"pierwszy_taniec.jpg",
		);
	});

	test("UC8: powinien pozwolić dodać zdjęcie z aparatu (przez input capture) i wysłać je do galerii", async ({
		page,
	}) => {
		await page.goto("/g/kasia-i-tomek");

		// Otwarcie drawera
		await page.getByRole("button", { name: /Dodaj zdjęcia i filmy/i }).click();

		// Podpis gościa dla zrobionego zdjęcia
		const nameInput = page.getByPlaceholder("np. Ciocia Kasia i Wujek Michał");
		await nameInput.fill("Photobooth E2E Gość");

		// Symulacja zrobienia zdjęcia z aparatu
		// (Playwright nie otwiera natywnego UI aparatu, po prostu ustawiamy plik w ukrytym input#native-camera-input)
		const timestamp = Date.now();
		const exactFileName = `photobooth_${timestamp}.jpg`;

		// Prawdziwy, minimalny obrazek JPEG 1x1 px zakodowany w Base64
		// (aby Sharp na backendzie poprawnie przetworzył miniaturkę bez wywalania błędu Vips)
		const b64Jpeg =
			"/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
		await page.locator("input#native-camera-input").setInputFiles({
			name: exactFileName,
			mimeType: "image/jpeg",
			buffer: Buffer.from(b64Jpeg, "base64"),
		});

		// Plik w kolejce
		const queuedFileName = page.getByText(exactFileName);
		await expect(queuedFileName).toBeVisible();

		// Wysyłka dokładnie tym samym potokiem TUS co zwykły upload
		await page.getByRole("button", { name: /Wyślij do galerii/i }).click();
		await expect(page.getByText("Gotowe, wróć do galerii")).toBeVisible({
			timeout: 30000,
		});
		await page.getByRole("button", { name: "Gotowe, wróć do galerii" }).click();

		// Zdjęcie z photobooth pojawia się w galerii na tych samych zasadach co zwykły upload
		await expect(
			page.getByRole("button", {
				name: new RegExp(`^Zdjęcie: ${exactFileName}, `),
			}),
		).toBeVisible({ timeout: 30000 });
	});

	test("UC9: powinien pokazać ranking TOP 3 najaktywniejszych gości w poprawnej kolejności", async ({
		page,
	}) => {
		// Trzech różnych "gości" o różnej liczbie wgranych materiałów, plus czwarty
		// (spoza podium) i dwa wgrania tej samej osoby zapisane niespójnie
		// (wielkość liter / spacje), by upewnić się, że liczą się razem.
		const leaderboardMedia = [
			{
				id: "lb-1",
				uploaderName: "Wujek Staszek",
				fileType: "image" as const,
				mimeType: "image/jpeg",
				originalFileName: "foto1.jpg",
				fileSize: 100000,
				thumbUrl: "#",
				rawUrl: "#",
				createdAt: "2026-09-12T15:00:00.000Z",
			},
			{
				id: "lb-2",
				uploaderName: "wujek staszek ",
				fileType: "image" as const,
				mimeType: "image/jpeg",
				originalFileName: "foto2.jpg",
				fileSize: 100000,
				thumbUrl: "#",
				rawUrl: "#",
				createdAt: "2026-09-12T15:01:00.000Z",
			},
			{
				id: "lb-3",
				uploaderName: "Wujek Staszek",
				fileType: "image" as const,
				mimeType: "image/jpeg",
				originalFileName: "foto3.jpg",
				fileSize: 100000,
				thumbUrl: "#",
				rawUrl: "#",
				createdAt: "2026-09-12T15:02:00.000Z",
			},
			{
				id: "lb-4",
				uploaderName: "Ciocia Halinka",
				fileType: "image" as const,
				mimeType: "image/jpeg",
				originalFileName: "foto4.jpg",
				fileSize: 100000,
				thumbUrl: "#",
				rawUrl: "#",
				createdAt: "2026-09-12T15:03:00.000Z",
			},
			{
				id: "lb-5",
				uploaderName: "Ciocia Halinka",
				fileType: "image" as const,
				mimeType: "image/jpeg",
				originalFileName: "foto5.jpg",
				fileSize: 100000,
				thumbUrl: "#",
				rawUrl: "#",
				createdAt: "2026-09-12T15:04:00.000Z",
			},
			{
				id: "lb-6",
				uploaderName: "Kuzyn Tomek",
				fileType: "image" as const,
				mimeType: "image/jpeg",
				originalFileName: "foto6.jpg",
				fileSize: 100000,
				thumbUrl: "#",
				rawUrl: "#",
				createdAt: "2026-09-12T15:05:00.000Z",
			},
			{
				id: "lb-7",
				uploaderName: "Nieznajomy Gość",
				fileType: "image" as const,
				mimeType: "image/jpeg",
				originalFileName: "foto7.jpg",
				fileSize: 100000,
				thumbUrl: "#",
				rawUrl: "#",
				createdAt: "2026-09-12T15:06:00.000Z",
			},
		];

		await page.route("**/api/gallery/kasia-i-tomek/media", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ media: leaderboardMedia }),
			});
		});

		await page.goto("/g/kasia-i-tomek");

		const leaderboard = page.getByRole("region", {
			name: "Najaktywniejsi goście",
		});
		await expect(leaderboard).toBeVisible();

		const rows = leaderboard.getByRole("listitem");
		await expect(rows).toHaveCount(3);

		// Kolejność malejąco: Wujek Staszek (3, po zgrupowaniu) > Ciocia Halinka (2) > Kuzyn Tomek (1)
		await expect(rows.nth(0)).toContainText("Wujek Staszek");
		await expect(rows.nth(0)).toContainText("3 materiałów");
		await expect(rows.nth(1)).toContainText("Ciocia Halinka");
		await expect(rows.nth(1)).toContainText("2 materiałów");
		await expect(rows.nth(2)).toContainText("Kuzyn Tomek");
		await expect(rows.nth(2)).toContainText("1 materiałów");

		// Czwarty gość (Nieznajomy Gość, 1 materiał) nie mieści się na podium TOP 3
		await expect(leaderboard.getByText("Nieznajomy Gość")).not.toBeVisible();
	});

	test("UC10: powinien ukryć zdjęcia i wyświetlić komunikat o trybie prywatnym, jeśli galeria ma allowGuestViewing ustawione na false", async ({
		page,
	}) => {
		// Mock dla /api/gallery/[slug] zwracający allowGuestViewing: false
		await page.route("**/api/gallery/kasia-i-tomek", async (route) => {
			if (route.request().method() === "GET") {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						id: "gal-1",
						slug: "kasia-i-tomek",
						coupleNames: "Kasia & Tomek",
						weddingDate: "2026-09-12",
						allowGuestDownloads: true,
						allowGuestViewing: false, // <-- Kluczowa zmiana
						allowVideos: true,
					}),
				});
			} else {
				await route.continue();
			}
		});

		// Mock dla /api/gallery/[slug]/media zwracający pustą tablicę
		await page.route("**/api/gallery/kasia-i-tomek/media", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ media: [] }),
			});
		});

		await page.goto("/g/kasia-i-tomek");

		// Sprawdzamy, czy widoczny jest komunikat o trybie prywatnym
		await expect(
			page.getByText(
				"Galeria jest w trybie prywatnym. Możesz swobodnie dodawać zdjęcia – zobaczy je tylko Para Młoda.",
			),
		).toBeVisible();

		// Sprawdzamy, czy siatka zdjęć i brak zdjęć ("Brak zdjęć w tej galerii") SĄ NIEWIDOCZNE
		await expect(page.getByText("Brak zdjęć w tej galerii")).not.toBeVisible();

		// Ranking najaktywniejszych gości też powinien być niewidoczny w trybie prywatnym
		await expect(
			page.getByRole("region", { name: "Najaktywniejsi goście" }),
		).not.toBeVisible();

		// Pływający przycisk dodawania zdjęć (FAB) MUSI nadal być widoczny i aktywny
		const uploadBtn = page.getByRole("button", {
			name: /Dodaj zdjęcia i filmy/i,
		});
		await expect(uploadBtn).toBeVisible();
	});

	test("UC11: powinien ukryć przycisk dodawania zdjęć, jeśli galeria ma allowGuestUploads ustawione na false", async ({
		page,
	}) => {
		await page.route("**/api/gallery/kasia-i-tomek", async (route) => {
			if (route.request().method() === "GET") {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						id: "gal-1",
						slug: "kasia-i-tomek",
						coupleNames: "Kasia & Tomek",
						weddingDate: "2026-09-12",
						allowGuestDownloads: true,
						allowGuestViewing: true,
						allowGuestUploads: false, // <-- Kluczowa zmiana
						allowVideos: true,
					}),
				});
			} else {
				await route.continue();
			}
		});

		await page.goto("/g/kasia-i-tomek");

		const uploadBtn = page.getByRole("button", {
			name: /Dodaj zdjęcia i filmy/i,
		});
		await expect(uploadBtn).not.toBeVisible();
	});
});
