import { expect, test } from "@playwright/test";

test.describe("Panel Administratora", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/admin");
	});

	test("UC1: powinien zalogować admina poprawnymi danymi i wyświetlić panel zarządzania", async ({
		page,
	}) => {
		await expect(page.getByText("Panel Administratora")).toBeVisible();
		await page.locator('input[type="text"]').fill("admin");
		await page.locator('input[type="password"]').fill("admin123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		// Weryfikacja widoku panelu po zalogowaniu
		await expect(page.getByText("Zarządzanie WeddingDrop")).toBeVisible();
		await expect(page.getByText("Wszystkie wesela")).toBeVisible();
		await expect(page.getByText("Aktywne Galerie Weselne")).toBeVisible();
		await expect(page.getByText("Łączne zużycie dysku")).toBeVisible();
	});

	test("UC2: powinien odrzucić błędne hasło administratora i wyświetlić komunikat błędu", async ({
		page,
	}) => {
		await page.locator('input[type="text"]').fill("admin");
		await page.locator('input[type="password"]').fill("niepoprawne_haslo_xyz");
		await page.getByRole("button", { name: "Zaloguj się" }).click();

		// Komunikat błędu
		await expect(page.getByText("Błędne hasło")).toBeVisible();
		// Brak przejścia do panelu zarządzania
		await expect(page.getByText("Zarządzanie WeddingDrop")).not.toBeVisible();
	});

	test("UC3: powinien otworzyć i zamknąć modal tworzenia nowego wesela", async ({
		page,
	}) => {
		// Logowanie
		await page.locator('input[type="text"]').fill("admin");
		await page.locator('input[type="password"]').fill("admin123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();
		await expect(page.getByText("Zarządzanie WeddingDrop")).toBeVisible();

		// Otwarcie modalu
		const newWeddingBtn = page.getByRole("button", { name: /Nowe wesele/i });
		await expect(newWeddingBtn).toBeVisible();
		await newWeddingBtn.click();

		// Weryfikacja obecności pól formularza
		await expect(page.getByText("Nowa Galeria Weselna")).toBeVisible();
		await expect(page.getByPlaceholder("np. Kasia & Tomek")).toBeVisible();
		await expect(page.getByPlaceholder("np. kasia-i-tomek")).toBeVisible();
		await expect(page.getByPlaceholder("kontakt@kasiaitomek.pl")).toBeVisible();

		// Zamknięcie modalu przyciskiem X
		const closeBtn = page.locator("div.fixed button").first();
		await closeBtn.click();
		await expect(page.getByText("Nowa Galeria Weselna")).not.toBeVisible();
	});

	test("UC4: powinien pomyślnie utworzyć nowe wesele i wyświetlić je na liście", async ({
		page,
	}) => {
		const uniqueSlug = `e2e-${Date.now().toString().slice(-6)}`;
		const couple = `Para ${uniqueSlug}`;

		// Logowanie
		await page.locator('input[type="text"]').fill("admin");
		await page.locator('input[type="password"]').fill("admin123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();
		await expect(page.getByText("Zarządzanie WeddingDrop")).toBeVisible();

		// Otwarcie modalu
		await page.getByRole("button", { name: /Nowe wesele/i }).click();

		// Wypełnienie formularza
		await page.getByPlaceholder("np. Kasia & Tomek").fill(couple);
		await page.getByPlaceholder("np. kasia-i-tomek").fill(uniqueSlug);
		await page
			.getByPlaceholder("kontakt@kasiaitomek.pl")
			.fill(`${uniqueSlug}@example.com`);
		await page
			.getByPlaceholder("Hasło do moderacji i pobierania ZIP")
			.fill("sekret123");

		// Wysłanie formularza
		await page.getByRole("button", { name: /Utwórz wesele/i }).click();

		// Weryfikacja ekranu sukcesu
		await expect(
			page.getByText("Galeria została pomyślnie utworzona!"),
		).toBeVisible();
		await expect(page.getByText(`Slug: ${uniqueSlug}`)).toBeVisible();

		// Zamknięcie modalu i sprawdzenie obecności w tabeli
		await page.getByRole("button", { name: "Zamknij", exact: true }).click();
		await expect(
			page.getByRole("cell", { name: uniqueSlug, exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("cell", { name: couple, exact: true }),
		).toBeVisible();
	});

	test("UC5: powinien bezpiecznie rozwiązać kolizję sluga poprzez dodanie losowego sufiksu", async ({
		page,
	}) => {
		// Logowanie
		await page.locator('input[type="text"]').fill("admin");
		await page.locator('input[type="password"]').fill("admin123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();
		await expect(page.getByText("Zarządzanie WeddingDrop")).toBeVisible();

		// Otwarcie modalu
		await page.getByRole("button", { name: /Nowe wesele/i }).click();

		// Wypełnienie formularza ze slugiem, który już istnieje w bazie (np. 'kasia-i-tomek')
		const coupleName = `Kasia i Tomek ${Date.now().toString().slice(-4)}`;
		await page.getByPlaceholder("np. Kasia & Tomek").fill(coupleName);
		await page.getByPlaceholder("np. kasia-i-tomek").fill("kasia-i-tomek");
		await page
			.getByPlaceholder("kontakt@kasiaitomek.pl")
			.fill("kolejni@example.com");
		await page
			.getByPlaceholder("Hasło do moderacji i pobierania ZIP")
			.fill("sekret123");

		// Wysłanie formularza
		await page.getByRole("button", { name: /Utwórz wesele/i }).click();

		// Weryfikacja: aplikacja nie wyrzuca błędu 500, lecz bezpiecznie tworzy galerię z unikalnym sufiksem
		await expect(
			page.getByText("Galeria została pomyślnie utworzona!"),
		).toBeVisible();
		await expect(
			page.locator("text=/Slug: kasia-i-tomek-[a-z0-9]+/"),
		).toBeVisible();

		await page.getByRole("button", { name: "Zamknij", exact: true }).click();
		await expect(page.locator(`text=${coupleName}`)).toBeVisible();
	});

	test("UC6: powinien umożliwić usunięcie galerii po potwierdzeniu dialogu", async ({
		page,
	}) => {
		const slugToDelete = `del-${Date.now().toString().slice(-6)}`;

		// Logowanie
		await page.locator('input[type="text"]').fill("admin");
		await page.locator('input[type="password"]').fill("admin123");
		await page.getByRole("button", { name: "Zaloguj się" }).click();
		await expect(page.getByText("Zarządzanie WeddingDrop")).toBeVisible();

		// Utworzenie galerii tymczasowej do usunięcia
		await page.getByRole("button", { name: /Nowe wesele/i }).click();
		await page.getByPlaceholder("np. Kasia & Tomek").fill("Do Skasowania");
		await page.getByPlaceholder("np. kasia-i-tomek").fill(slugToDelete);
		await page
			.getByPlaceholder("kontakt@kasiaitomek.pl")
			.fill("del@example.com");
		await page
			.getByPlaceholder("Hasło do moderacji i pobierania ZIP")
			.fill("sekret123");
		await page.getByRole("button", { name: /Utwórz wesele/i }).click();
		await page.getByRole("button", { name: "Zamknij" }).click();

		// Weryfikacja obecności w tabeli
		const row = page.locator("tr", { hasText: slugToDelete });
		await expect(row).toBeVisible();

		// Akceptacja dialogu potwierdzenia usunięcia
		page.once("dialog", async (dialog) => {
			await dialog.accept();
		});

		// Kliknięcie ikony kosza w wierszu
		const deleteBtn = row.getByTitle("Usuń galerię");
		await deleteBtn.click();

		// Weryfikacja zniknięcia wiersza
		await expect(page.locator(`text=${slugToDelete}`)).not.toBeVisible();
	});
});
