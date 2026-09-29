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
		await expect(
			page.getByText("Galeria czeka na pierwsze zdjęcia!"),
		).toBeVisible();
		await expect(
			page.getByText("Bądź pierwszą osobą, która uwieczni ten wyjątkowy dzień"),
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
		const closeBtn = page.locator("div.fixed.z-50 button:has(svg)").first();
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
		await expect(page.getByText("Wujek Staszek")).toBeVisible();
		await expect(page.getByText("Ciocia Halinka")).toBeVisible();

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
		await page.getByText("Wujek Staszek").click();

		// Weryfikacja otwarcia Lightboxa
		await expect(page.getByText("1 z 2", { exact: true })).toBeVisible();
		await expect(
			page.getByText("pierwszy_taniec.jpg", { exact: true }),
		).toBeVisible();

		// Nawigacja klawiaturą: Strzałka w prawo -> zdjęcie 2
		await page.keyboard.press("ArrowRight");
		await expect(page.getByText("2 z 2", { exact: true })).toBeVisible();
		await expect(page.getByText("tort_weselny.jpg")).toBeVisible();

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
		await page.getByText("Wujek Staszek").click();
		await expect(page.getByText("1 z 2", { exact: true })).toBeVisible();

		// 1. Symulacja Swipe w lewo (przesunięcie palca z 300px do 100px -> diff > 45px -> Następne zdjęcie)
		await page.evaluate(() => {
			const el = document.querySelector(
				"div.fixed.inset-0.z-50",
			) as HTMLElement;
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
			const el = document.querySelector(
				"div.fixed.inset-0.z-50",
			) as HTMLElement;
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
		await page.getByText("Wujek Staszek").click();

		// Przycisk pobierania pliku
		const downloadBtn = page.getByTitle("Pobierz oryginalny plik");
		await expect(downloadBtn).toBeVisible();
		await expect(downloadBtn).toHaveAttribute(
			"download",
			"pierwszy_taniec.jpg",
		);
	});

	test("UC8: powinien pozwolić zrobić zdjęcie aparatem w przeglądarce (photobooth) i wysłać je do galerii tym samym potokiem co zwykły upload", async ({
		page,
	}) => {
		// Symulacja getUserMedia fałszywym strumieniem opartym o canvas (bez realnej
		// kamery/uprawnień) — działa identycznie w Chromium i WebKit, bo canvas.captureStream()
		// jest standardowym API HTML5, a nie sztuczką specyficzną dla jednej przeglądarki.
		await page.addInitScript(() => {
			const canvas = document.createElement("canvas");
			canvas.width = 320;
			canvas.height = 240;
			const ctx = canvas.getContext("2d");
			const paint = () => {
				if (ctx) {
					ctx.fillStyle = "goldenrod";
					ctx.fillRect(0, 0, canvas.width, canvas.height);
				}
				requestAnimationFrame(paint);
			};
			paint();

			const fakeStream = (
				canvas as HTMLCanvasElement & {
					captureStream: (frameRate?: number) => MediaStream;
				}
			).captureStream(15);

			const mediaDevicesStub = {
				getUserMedia: () => Promise.resolve(fakeStream),
			};
			Object.defineProperty(navigator, "mediaDevices", {
				configurable: true,
				get: () => mediaDevicesStub,
			});
		});

		await page.goto("/g/kasia-i-tomek");

		// Otwarcie drawera i przełączenie na tryb aparatu w przeglądarce
		await page.getByRole("button", { name: /Dodaj zdjęcia i filmy/i }).click();
		await page.getByRole("button", { name: "Zrób zdjęcie" }).click();

		// Podgląd na żywo z (fałszywej) kamery + gotowy przycisk spustu migawki
		const shutterBtn = page.getByRole("button", { name: "Zrób zdjęcie" });
		await expect(shutterBtn).toBeEnabled({ timeout: 15000 });
		// Krótkie oczekiwanie na załadowanie faktycznych wymiarów strumienia wideo
		// (video.videoWidth/videoHeight) zanim klatka zostanie zrzucona na canvas
		await page.waitForTimeout(500);

		// Podpis gościa dla zrobionego zdjęcia
		const nameInput = page.getByPlaceholder("np. Ciocia Kasia i Wujek Michał");
		await nameInput.fill("Photobooth E2E Gość");

		// Spust migawki -> kompozycja canvas + ramka motywu -> plik JPEG w kolejce
		await shutterBtn.click();
		const queuedFileName = page.getByText(/photobooth_\d+\.jpg/);
		await expect(queuedFileName).toBeVisible();
		// Dokładna, unikalna (znacznik czasu) nazwa pliku z tego konkretnego przebiegu testu —
		// unika niejednoznaczności strict-mode, gdy w tej samej, współdzielonej galerii
		// zostały już wcześniej zdjęcia z photobooth z innych przebiegów/profili Playwrighta.
		const exactFileName = (await queuedFileName.textContent())?.trim();
		expect(exactFileName).toMatch(/^photobooth_\d+\.jpg$/);

		// Wysyłka dokładnie tym samym przyciskiem/potokiem TUS co zwykły upload
		await page.getByRole("button", { name: /Wyślij do galerii/i }).click();
		await expect(page.getByText("Gotowe, wróć do galerii")).toBeVisible({
			timeout: 30000,
		});
		await page.getByRole("button", { name: "Gotowe, wróć do galerii" }).click();

		// Zdjęcie z photobooth pojawia się w galerii na tych samych zasadach co zwykły upload
		await expect(
			page.getByRole("button", {
				name: new RegExp(`^Image: ${exactFileName}, `),
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
});
