import { expect, test } from "@playwright/test";

test.describe("Generator i Edytor Karteczki A6", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/g/kasia-i-tomek/card");
		await expect(page.locator("#printable-card")).toBeVisible();
	});

	test("UC1: powinien załadować widok projektanta z podglądem karty A6 i kodem QR", async ({
		page,
	}) => {
		await expect(page.getByText("Karteczka na Stolik (A6)")).toBeVisible();
		await expect(page.getByText("Projektant Karteczki")).toBeVisible();

		const printableCard = page.locator("#printable-card");
		await expect(printableCard).toBeVisible();
		await expect(printableCard).toContainText("Kasia & Tomek");
		await expect(printableCard).toContainText("2026-09-12");

		// Kod QR w podglądzie
		const qrImg = printableCard.locator("img");
		await expect(qrImg).toBeVisible();
	});

	test("UC2: powinien umożliwić przełączanie motywów kolorystycznych i weryfikację stylów", async ({
		page,
	}) => {
		// 1. Zmiana na Butelkowa Zieleń (#1B4332 / #D4AF37)
		const emeraldPalette = page.getByRole("button", {
			name: /Butelkowa Zieleń/i,
		});
		await expect(emeraldPalette).toBeVisible();
		await emeraldPalette.click();

		const textInput = page.locator(
			'div:has(> label:has-text("Kolor tekstu i QR")) input[type="text"]',
		);
		const frameInput = page.locator(
			'div:has(> label:has-text("Kolor złotej ramki")) input[type="text"]',
		);

		await expect(textInput).toHaveValue("#1B4332");
		await expect(frameInput).toHaveValue("#D4AF37");

		// 2. Zmiana na Pudrowy Róż (#2D3748 / #E0A899)
		const rosePalette = page.getByRole("button", { name: /Pudrowy Róż/i });
		await expect(rosePalette).toBeVisible();
		await rosePalette.click();

		await expect(textInput).toHaveValue("#2D3748");
		await expect(frameInput).toHaveValue("#E0A899");

		// 3. Zmiana na Klasyczna Czerń (#0F172A / #475569)
		const blackPalette = page.getByRole("button", { name: /Klasyczna Czerń/i });
		await blackPalette.click();
		await expect(textInput).toHaveValue("#0F172A");
		await expect(frameInput).toHaveValue("#475569");
	});

	test("UC3: powinien aktualizować nagłówek i instrukcję w czasie rzeczywistym na podglądzie", async ({
		page,
	}) => {
		const printableCard = page.locator("#printable-card");
		const headlineInput = page.locator(
			'div:has(> label:has-text("Nagłówek")) input',
		);
		await expect(headlineInput).toBeVisible();

		await headlineInput.fill("Dziękujemy za obecność!");
		await expect(printableCard).toContainText("Dziękujemy za obecność!");

		// Edycja instrukcji w textarea
		const textarea = page.locator("textarea");
		await expect(textarea).toBeVisible();
		await textarea.fill(
			"Krok 1: Skieruj aparat na kod\nKrok 2: Ciesz się wspomnieniami!",
		);
		await expect(printableCard).toContainText("Krok 1: Skieruj aparat na kod");
		await expect(printableCard).toContainText(
			"Krok 2: Ciesz się wspomnieniami!",
		);
	});

	test("UC4: powinien generować link do pobrania PDF zawierający parametry konfiguracyjne w query stringu", async ({
		page,
	}) => {
		const headlineInput = page.locator(
			'div:has(> label:has-text("Nagłówek")) input',
		);
		await expect(headlineInput).toBeVisible();
		await headlineInput.fill("Wielkie Wesele");

		// Wybór palety Klasyczna Czerń (#0F172A / #475569)
		await page.getByRole("button", { name: /Klasyczna Czerń/i }).click();

		// Weryfikacja linku pobierania PDF
		const pdfBtn = page.getByRole("link", {
			name: /Pobierz karteczkę A6 w formacie PDF \(300 DPI\)/i,
		});
		await expect(pdfBtn).toBeVisible();

		// Oczekiwanie na atrybut href zawierający zaktualizowane parametry
		await expect(pdfBtn).toHaveAttribute(
			"href",
			/primaryColor=%230F172A.*headline=Wielkie%20Wesele/,
		);
	});

	test("UC5: powinien przenieść użytkownika z powrotem do galerii po kliknięciu linku", async ({
		page,
	}) => {
		const returnLink = page.getByRole("link", { name: /Powrót do galerii/i });
		await expect(returnLink).toBeVisible();
		await returnLink.click();

		// Weryfikacja przejścia do strony głównej galerii gościa
		await expect(page).toHaveURL(/\/g\/kasia-i-tomek$/);
		await expect(page.locator("h1")).toContainText("Kasia & Tomek");
	});
});
