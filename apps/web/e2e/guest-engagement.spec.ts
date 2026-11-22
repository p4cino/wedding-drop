import { expect, test } from "@playwright/test";

const SVG_GOLD =
	"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='goldenrod'/><text x='20' y='100' fill='white'>Foto 1</text></svg>";
const SVG_RED =
	"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='darkred'/><text x='20' y='100' fill='white'>Foto 2</text></svg>";

test.describe("Pakiet Zaangażowania Gości (Reakcje ❤️, Foto-Wyzwania, Podpisy i Tryb TV 2.0)", () => {
	test("UC1: powinien umożliwiać polubienie zdjęcia na żywo, zapamiętywać stan w localStorage oraz sortować galerię według Najpopularniejszych", async ({
		page,
	}) => {
		const mediaStore = [
			{
				id: "eng-1",
				uploaderName: "Wujek Staszek",
				fileType: "image" as const,
				mimeType: "image/jpeg",
				originalFileName: "taniec.jpg",
				fileSize: 1024000,
				thumbUrl: SVG_GOLD,
				rawUrl: SVG_GOLD,
				likesCount: 1,
				caption: null,
				questId: null,
				createdAt: "2026-09-12T16:00:00.000Z",
			},
			{
				id: "eng-2",
				uploaderName: "Ciocia Halinka",
				fileType: "image" as const,
				mimeType: "image/jpeg",
				originalFileName: "tort.jpg",
				fileSize: 2048000,
				thumbUrl: SVG_RED,
				rawUrl: SVG_RED,
				likesCount: 5,
				caption: null,
				questId: null,
				createdAt: "2026-09-12T15:00:00.000Z",
			},
		];

		await page.route("**/api/gallery/kasia-i-tomek/media", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ media: mediaStore }),
			});
		});

		await page.route(
			"**/api/gallery/kasia-i-tomek/media/*/like",
			async (route) => {
				const url = route.request().url();
				const match = url.match(/\/media\/([^/]+)\/like/);
				const id = match?.[1] ?? "";
				const body = route.request().postDataJSON() as {
					action: "like" | "unlike";
				};
				const item = mediaStore.find((m) => m.id === id);
				if (!item) {
					await route.fulfill({ status: 404 });
					return;
				}
				item.likesCount =
					body.action === "like"
						? item.likesCount + 1
						: Math.max(0, item.likesCount - 1);
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ id: item.id, likesCount: item.likesCount }),
				});
			},
		);

		await page.goto("/g/kasia-i-tomek");

		// Domyślne sortowanie "Najnowsze": pierwsze zdjęcie w siatce to Wujek Staszek (eng-1)
		const tileButtons = page
			.locator("main")
			.locator('button[aria-label^="Zdjęcie:"]');
		await expect(tileButtons).toHaveCount(2);
		await expect(tileButtons.nth(0)).toHaveAttribute(
			"aria-label",
			/Wujek Staszek/,
		);
		await expect(tileButtons.nth(1)).toHaveAttribute(
			"aria-label",
			/Ciocia Halinka/,
		);

		// Kliknięcie serduszka na pierwszym kafelku zwiększa licznik z 1 na 2 i nie otwiera Lightboxa
		const likeBtn1 = page.getByTestId("like-btn-eng-1");
		await expect(likeBtn1).toContainText("1");
		await expect(likeBtn1).toHaveAttribute("aria-pressed", "false");

		await likeBtn1.click();
		await expect(likeBtn1).toContainText("2");
		await expect(likeBtn1).toHaveAttribute("aria-pressed", "true");
		await expect(page.locator('[role="dialog"]')).not.toBeVisible();

		// Stan polubienia jest zapisany w localStorage pod kluczem wd_likes_kasia-i-tomek
		const storedLikes = await page.evaluate(() =>
			window.localStorage.getItem("wd_likes_kasia-i-tomek"),
		);
		expect(storedLikes).toContain("eng-1");

		// Przełączenie sortowania na "Najpopularniejsze ❤️" ustawia Ciocię Halinkę (5) przed Wujkiem Staszkiem (2)
		await page.getByRole("button", { name: /Najpopularniejsze/i }).click();
		await expect(tileButtons.nth(0)).toHaveAttribute(
			"aria-label",
			/Ciocia Halinka/,
		);
		await expect(tileButtons.nth(1)).toHaveAttribute(
			"aria-label",
			/Wujek Staszek/,
		);

		// Otwarcie Lightboxa na pierwszym kafelku (Ciocia Halinka) i polubienie z poziomu Lightboxa
		await tileButtons.nth(0).click();
		const lightboxLikeBtn = page.getByTestId("lightbox-like-btn");
		await expect(lightboxLikeBtn).toBeVisible();
		await expect(lightboxLikeBtn).toContainText("5");
		await lightboxLikeBtn.click();
		await expect(lightboxLikeBtn).toContainText("6");
		await expect(lightboxLikeBtn).toHaveAttribute("aria-pressed", "true");
	});

	test("UC2: powinien wyświetlać pasek Foto-Wyzwań, odznaki 🎯 i podpisy caption oraz filtrować zdjęcia i otwierać drawer z wybranym wyzwaniem", async ({
		page,
	}) => {
		const questsConfig = {
			enabled: true,
			items: [
				{ id: "selfie-z-para-mloda", title: "Selfie z Parą Młodą" },
				{ id: "toast-przy-naszym-stoliku", title: "Toast przy naszym stoliku" },
			],
		};

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
						isActive: true,
						allowGuestDownloads: true,
						allowGuestViewing: true,
						allowGuestUploads: true,
						allowVideos: true,
						isApprovalQueueEnabled: false,
						questsConfig,
					}),
				});
			} else {
				await route.continue();
			}
		});

		await page.route("**/api/gallery/kasia-i-tomek/media", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					media: [
						{
							id: "q-media-1",
							uploaderName: "Świadek Piotr",
							fileType: "image",
							mimeType: "image/jpeg",
							originalFileName: "selfie.jpg",
							fileSize: 1024000,
							thumbUrl: SVG_GOLD,
							rawUrl: SVG_GOLD,
							likesCount: 3,
							caption: "Stolik nr 4 bawi się najlepiej!",
							questId: "selfie-z-para-mloda",
							createdAt: "2026-09-12T17:00:00.000Z",
						},
						{
							id: "q-media-2",
							uploaderName: "Kuzynka Ania",
							fileType: "image",
							mimeType: "image/jpeg",
							originalFileName: "parkiet.jpg",
							fileSize: 1024000,
							thumbUrl: SVG_RED,
							rawUrl: SVG_RED,
							likesCount: 0,
							caption: null,
							questId: null,
							createdAt: "2026-09-12T16:30:00.000Z",
						},
					],
				}),
			});
		});

		await page.goto("/g/kasia-i-tomek");

		// Pasek Foto-Wyzwań nad galerią
		const questsRegion = page.getByRole("region", {
			name: /Foto-Wyzwania/i,
		});
		await expect(questsRegion).toBeVisible();
		await expect(
			questsRegion.getByRole("button", { name: /Selfie z Parą Młodą/i }),
		).toContainText("1");
		await expect(
			questsRegion.getByRole("button", { name: /Toast przy naszym stoliku/i }),
		).toContainText("0");

		// Podpis kontekstowy i odznaka wyzwania na kafelku w siatce
		await expect(
			page.locator("main").getByText("Stolik nr 4 bawi się najlepiej!"),
		).toBeVisible();
		await expect(
			page.locator("main").getByText("🎯 Selfie z Parą Młodą"),
		).toBeVisible();

		// Filtrowanie siatki po kliknięciu wyzwania "Selfie z Parą Młodą"
		await questsRegion
			.getByRole("button", { name: /Selfie z Parą Młodą/i })
			.click();
		await expect(page.locator("main").getByText("Świadek Piotr")).toBeVisible();
		await expect(
			page.locator("main").getByText("Kuzynka Ania"),
		).not.toBeVisible();

		// Kliknięcie "Dodaj zdjęcie do wyzwania" otwiera UploaderDrawer z wstępnie wybranym wyzwaniem i polem caption
		await questsRegion
			.getByRole("button", { name: /Dodaj zdjęcie do wyzwania/i })
			.click();

		const dialog = page.locator('[role="dialog"]');
		await expect(dialog).toBeVisible();
		await expect(
			dialog.getByRole("button", { name: /Selfie z Parą Młodą/i }),
		).toHaveAttribute("aria-pressed", "true");

		const captionInput = dialog.getByPlaceholder(
			"np. Stolik nr 4 bawi się najlepiej!",
		);
		await expect(captionInput).toBeVisible();
		await captionInput.fill("Nasze wspólne selfie!");
		await expect(dialog.getByText("21/140 znaków")).toBeVisible();
	});

	test("UC3: powinien umożliwiać Parze Młodej włączenie i zapisanie konfiguracji Foto-Wyzwań w panelu właściciela", async ({
		page,
	}) => {
		let savedQuestsPayload: {
			enabled?: boolean;
			items?: Array<{ id: string; title: string }>;
		} | null = null;

		await page.route("**/api/owner/kasia-i-tomek/settings", async (route) => {
			if (route.request().method() === "PATCH") {
				const body = route.request().postDataJSON() as {
					questsConfig?: {
						enabled: boolean;
						items: Array<{ id: string; title: string }>;
					};
				};
				if (body.questsConfig) {
					savedQuestsPayload = body.questsConfig;
				}
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ success: true }),
				});
			} else {
				await route.continue();
			}
		});

		await page.goto("/owner/kasia-i-tomek");
		await page.getByPlaceholder("Wpisz hasło dostępu").fill("sekret123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		await expect(page.getByText("Foto-Wyzwania (Weselne Bingo)")).toBeVisible();

		// Włączenie Foto-Wyzwań
		const enableCheckbox = page.getByLabel(
			/Włącz Foto-Wyzwania w galerii gości/i,
		);
		await enableCheckbox.check();

		// Dodanie wyzwania z szablonu oraz własnego wyzwania
		await page
			.getByRole("button", { name: "Selfie z Parą Młodą", exact: true })
			.click();
		await page
			.getByPlaceholder("np. Zdjęcie z tortem weselnym")
			.fill("Zdjęcie z tortem weselnym");
		await page.getByRole("button", { name: "Dodaj wyzwanie" }).click();

		// Zapisanie konfiguracji
		await page.getByRole("button", { name: "Zapisz wyzwania" }).click();

		await expect.poll(() => savedQuestsPayload !== null).toBe(true);
		expect(savedQuestsPayload?.enabled).toBe(true);
		expect(savedQuestsPayload?.items).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ title: "Selfie z Parą Młodą" }),
				expect.objectContaining({ title: "Zdjęcie z tortem weselnym" }),
			]),
		);
	});

	test("UC4: Tryb TV 2.0 (/g/{slug}/tv) powinien wyświetlać podpis caption, odznakę wyzwania, licznik serduszek oraz natychmiast pokazywać nowe życzenie (SSE new-wish)", async ({
		page,
	}) => {
		await page.route("**/api/gallery/kasia-i-tomek", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					id: "gal-1",
					slug: "kasia-i-tomek",
					coupleNames: "Kasia & Tomek",
					weddingDate: "2026-09-12",
					isActive: true,
					allowGuestDownloads: true,
					allowGuestViewing: true,
					allowGuestUploads: true,
					allowVideos: true,
					isApprovalQueueEnabled: false,
					questsConfig: {
						enabled: true,
						items: [{ id: "pierwszy-taniec", title: "Pierwszy taniec" }],
					},
				}),
			});
		});

		await page.route("**/api/gallery/kasia-i-tomek/media", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					media: [
						{
							id: "tv-eng-1",
							uploaderName: "Wujek Janusz",
							fileType: "image",
							mimeType: "image/jpeg",
							originalFileName: "pierwszy-taniec.jpg",
							fileSize: 1024000,
							thumbUrl: SVG_GOLD,
							rawUrl: SVG_GOLD,
							status: "ready",
							likesCount: 7,
							caption: "Najpiękniejszy pierwszy taniec!",
							questId: "pierwszy-taniec",
							createdAt: "2026-09-12T19:00:00.000Z",
						},
					],
				}),
			});
		});

		await page.route("**/api/gallery/kasia-i-tomek/wishes", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					wishes: [
						{
							id: "wish-initial",
							guestName: "Ciocia Basia",
							message: "Niech miłość trwa wiecznie!",
							status: "ready",
							createdAt: "2026-09-12T18:50:00.000Z",
						},
					],
				}),
			});
		});

		await page.route("**/api/gallery/kasia-i-tomek/live", async (route) => {
			// Po krótkiej chwili emitujemy zdarzenie SSE `new-wish`, aby zweryfikować
			// natychmiastowy przeskok Trybu TV 2.0 na pełnoekranową kartę nowego życzenia
			await new Promise((resolve) => setTimeout(resolve, 1400));
			const payload = `data: ${JSON.stringify({
				type: "new-wish",
				wish: {
					id: "wish-live-1",
					guestName: "Dziadek Leon",
					message: "Sto lat Młodej Parze na żywo!",
					status: "ready",
					createdAt: "2026-09-12T19:05:00.000Z",
				},
			})}\n\n`;
			await route.fulfill({
				status: 200,
				contentType: "text/event-stream",
				body: payload,
			});
		});

		await page.goto("/g/kasia-i-tomek/tv");

		// Początkowy slajd ze zdjęciem prezentuje podpis caption, odznakę wyzwania i licznik serduszek
		await expect(page.getByTestId("tv-media-caption")).toHaveText(
			"Najpiękniejszy pierwszy taniec!",
		);
		await expect(page.getByTestId("tv-quest-badge")).toContainText(
			"Pierwszy taniec",
		);
		await expect(page.getByTestId("tv-likes-badge")).toContainText("7");

		// Po nadejściu zdarzenia SSE `new-wish` ekran TV natychmiast przełącza się na kartę życzenia
		await expect(page.getByTestId("tv-wish-slide")).toBeVisible({
			timeout: 8000,
		});
		await expect(page.getByTestId("tv-wish-badge")).toContainText(
			"Księga Życzeń",
		);
		await expect(page.getByTestId("tv-wish-message")).toHaveText(
			"Sto lat Młodej Parze na żywo!",
		);
		await expect(page.getByTestId("tv-wish-author")).toContainText(
			"Dziadek Leon",
		);
	});
});
