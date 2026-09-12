import { test, expect } from "@playwright/test";

test.describe("Panel Pary Młodej (Właściciela)", () => {
  test("UC1: powinien umożliwić logowanie hasłem i wyświetlić panel zarządzania", async ({ page }) => {
    await page.goto("/owner/kasia-i-tomek");

    // Ekran logowania
    await expect(page.getByText("Panel Pary Młodej")).toBeVisible();
    const passwordInput = page.getByPlaceholder("Wpisz hasło dostępu");
    await expect(passwordInput).toBeVisible();

    // Podanie hasła i zatwierdzenie
    await passwordInput.fill("wesele2026");
    await page.getByRole("button", { name: "Zaloguj się" }).click();

    // Po zalogowaniu widok dashboardu
    await expect(page.getByText("Zarządzanie galerią i moderacja treści")).toBeVisible();
    await expect(page.getByText("Zajęte miejsce")).toBeVisible();
    await expect(page.getByText("Zdjęcia")).toBeVisible();
    await expect(page.getByText("Filmy")).toBeVisible();
  });

  test("UC2: powinien odrzucić błędne hasło właściciela i wyświetlić błąd", async ({ page }) => {
    await page.goto("/owner/kasia-i-tomek");

    const passwordInput = page.getByPlaceholder("Wpisz hasło dostępu");
    await passwordInput.fill("calkowicie_bledne_haslo");
    await page.getByRole("button", { name: "Zaloguj się" }).click();

    await expect(page.getByText("Nieprawidłowe hasło")).toBeVisible();
    await expect(page.getByText("Zarządzanie galerią i moderacja treści")).not.toBeVisible();
  });

  test("UC3: powinien wygenerować link do pobrania ZIP zawierający hasło właściciela", async ({ page }) => {
    await page.goto("/owner/kasia-i-tomek");
    await page.getByPlaceholder("Wpisz hasło dostępu").fill("wesele2026");
    await page.getByRole("button", { name: "Zaloguj się" }).click();

    await expect(page.getByText("Zarządzanie galerią i moderacja treści")).toBeVisible();

    // Przycisk pobierania ZIP
    const zipBtn = page.getByRole("link", { name: /Pobierz wszystko \(\.ZIP\)/i });
    await expect(zipBtn).toBeVisible();
    await expect(zipBtn).toHaveAttribute(
      "href",
      "/api/gallery/kasia-i-tomek/zip?password=wesele2026"
    );
  });

  test("UC4: powinien umożliwić moderację widoczności zdjęcia (ukryj / pokaż)", async ({ page }) => {
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
              thumbUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='gold'/></svg>",
              rawUrl: "#",
              status: "ready",
              createdAt: "2026-09-12T12:00:00.000Z",
            },
          ],
        }),
      });
    });

    await page.goto("/owner/kasia-i-tomek");
    await page.getByPlaceholder("Wpisz hasło dostępu").fill("wesele2026");
    await page.getByRole("button", { name: "Zaloguj się" }).click();

    await expect(page.getByText("Świadek Jan")).toBeVisible();

    // Kliknięcie ikony ukrywania (Oko)
    const toggleBtn = page.getByTitle("Ukryj przed gośćmi");
    await expect(toggleBtn).toBeVisible();

    // Przechwycenie żądania toggle-status
    await page.route("**/api/owner", async (route) => {
      const body = route.request().postDataJSON();
      if (body.action === "toggle-status") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
      } else {
        await route.continue();
      }
    });

    await toggleBtn.click();

    // Po ukryciu pojawia się plakietka 'Ukryte' i ikona zmienia się na 'Pokaż w galerii'
    await expect(page.getByText("Ukryte", { exact: true })).toBeVisible();
    await expect(page.getByTitle("Pokaż w galerii")).toBeVisible();
  });

  test("UC5: powinien poprawnie filtrować multimedia (wszystkie / widoczne / ukryte)", async ({ page }) => {
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
              thumbUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='pink'/></svg>",
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
              thumbUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='gray'/></svg>",
              rawUrl: "#",
              status: "hidden",
              createdAt: "2026-09-12T12:05:00.000Z",
            },
          ],
        }),
      });
    });

    await page.goto("/owner/kasia-i-tomek");
    await page.getByPlaceholder("Wpisz hasło dostępu").fill("wesele2026");
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

  test("UC6: powinien umożliwić usunięcie zdjęcia z listy mediów po potwierdzeniu dialogu", async ({ page }) => {
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
              thumbUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='red'/></svg>",
              rawUrl: "#",
              status: "ready",
              createdAt: "2026-09-12T12:00:00.000Z",
            },
          ],
        }),
      });
    });

    await page.goto("/owner/kasia-i-tomek");
    await page.getByPlaceholder("Wpisz hasło dostępu").fill("wesele2026");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page.getByText("Do Skasowania")).toBeVisible();

    // Przechwycenie akcji usunięcia
    await page.route("**/api/owner", async (route) => {
      const body = route.request().postDataJSON();
      if (body.action === "delete-media") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
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

  test("UC7: powinien zawierać bezpośredni link nawigacyjny do projektanta winietek A6", async ({ page }) => {
    await page.goto("/owner/kasia-i-tomek");
    await page.getByPlaceholder("Wpisz hasło dostępu").fill("wesele2026");
    await page.getByRole("button", { name: "Zaloguj się" }).click();

    const cardLink = page.getByRole("link", { name: /Karteczka A6/i });
    await expect(cardLink).toBeVisible();
    await expect(cardLink).toHaveAttribute("href", "/g/kasia-i-tomek/card");
  });
});
