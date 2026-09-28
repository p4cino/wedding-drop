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
		await page.getByText("Wujek Staszek").click();

		// Przycisk pobierania pliku
		const downloadBtn = page.getByTitle("Pobierz oryginalny plik");
		await expect(downloadBtn).toBeVisible();
		await expect(downloadBtn).toHaveAttribute(
			"download",
			"pierwszy_taniec.jpg",
		);
	});
});
