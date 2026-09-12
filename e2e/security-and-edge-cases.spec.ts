import { test, expect } from "@playwright/test";

test.describe("Bezpieczeństwo i Przypadki Brzegowe (Security & Edge Cases)", () => {
  test("UC1: zapytanie o ukryte zdjęcia bez autoryzacji powinno zwrócić 401 Unauthorized", async ({ request }) => {
    const res = await request.get("/api/gallery/kasia-i-tomek/media?includeHidden=true");
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.error).toContain("Brak uprawnień");
  });

  test("UC2: zapytanie o nieistniejącą galerię w widoku gościa powinno wyświetlić elegancki ekran 404", async ({ page }) => {
    await page.goto("/g/nieistniejacy-slug-galerii-999");

    await expect(page.getByText("Galeria nie została znaleziona")).toBeVisible();
    await expect(page.getByText("Upewnij się, że adres URL lub kod QR jest prawidłowy.")).toBeVisible();

    const homeBtn = page.getByRole("link", { name: "Strona główna" });
    await expect(homeBtn).toBeVisible();
    await expect(homeBtn).toHaveAttribute("href", "/");
  });

  test("UC3: próba Directory Traversal w /media-file/* powinna zostać zablokowana przez sandbox", async ({ request }) => {
    // Próba odpytania o plik wykraczający poza sandbox /app/data
    const res = await request.get("/media-file/..%2F..%2Fpackage.json");
    // Serwer powinien odrzucić zapytanie kodem 400 lub 403
    expect([400, 403, 404]).toContain(res.status());
  });

  test("UC4: żądanie pobrania ZIP dla pustej galerii powinno zwrócić 400 z komunikatem", async ({ request }) => {
    const loginRes = await request.post("/api/admin", {
      data: { action: "login", username: "admin", password: "admin123" },
    });
    const { adminToken } = await loginRes.json();
    const emptySlug = `empty-${Date.now().toString().slice(-6)}`;
    const createRes = await request.post("/api/admin", {
      data: {
        action: "create-gallery",
        token: adminToken,
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
    await request.post("/api/admin", {
      data: {
        action: "delete-gallery",
        token: adminToken,
        galleryId: createData.gallery.id,
      },
    });
  });

  test("UC5: akcja administracyjna z sfałszowanym tokenem powinna zwrócić 401", async ({ request }) => {
    const res = await request.post("/api/admin", {
      data: {
        action: "list-galleries",
        token: "admin_1720000000000_YWRtaW4=_niepoprawny_podpis_hmac_12345",
      },
    });

    expect(res.status()).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Brak uprawnień administratora");
  });

  test("UC6: panel właściciela powinien poprawnie obsługiwać próbę dostępu do nieistniejącej galerii", async ({ request }) => {
    const res = await request.post("/api/owner", {
      data: {
        action: "login",
        slug: "calkowicie-nieistniejaca-galeria",
        password: "dowolne-haslo",
      },
    });

    expect(res.status()).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("Galeria nie istnieje");
  });

  test("UC7: tworzenie wesela z niebezpiecznym slugiem (znaki specjalne i ../) powinno zostać bezpiecznie oczyszczone", async ({ request }) => {
    const loginRes = await request.post("/api/admin", {
      data: { action: "login", username: "admin", password: "admin123" },
    });
    const { adminToken } = await loginRes.json();

    const createRes = await request.post("/api/admin", {
      data: {
        action: "create-gallery",
        token: adminToken,
        coupleNames: "Bezpieczna Para",
        weddingDate: "2026-11-20",
        ownerEmail: "safe@example.com",
        ownerPassword: "haslo",
        customSlug: "zly slug!@# z path/../",
      },
    });

    expect(createRes.status()).toBe(200);
    const createData = await createRes.json();
    expect(createData.success).toBe(true);
    expect(createData.gallery.slug).toMatch(/^[a-z0-9_-]+$/);
    expect(createData.gallery.slug).not.toContain("/");
    expect(createData.gallery.slug).not.toContain("..");

    // Sprzątanie po teście
    await request.post("/api/admin", {
      data: {
        action: "delete-gallery",
        token: adminToken,
        galleryId: createData.gallery.id,
      },
    });
  });
});
