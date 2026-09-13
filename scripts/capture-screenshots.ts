import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

// Wysokiej jakości realistyczne grafiki ślubne w formacie SVG (bez zewnętrznych zależności sieciowych)
const MOCK_WEDDING_MEDIA = [
	{
		id: "media-1",
		uploaderName: "Świadkowa Ania",
		fileType: "image",
		mimeType: "image/jpeg",
		originalFileName: "pierwszy_taniec.jpg",
		fileSize: 4194304,
		status: "ready",
		createdAt: "2026-09-12T17:45:00.000Z",
		thumbUrl:
			"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%231e293b'/><stop offset='50%' stop-color='%23334155'/><stop offset='100%' stop-color='%230f172a'/></linearGradient><radialGradient id='spot' cx='50%' cy='40%' r='40%'><stop offset='0%' stop-color='%23fef08a' stop-opacity='0.6'/><stop offset='100%' stop-color='%23fef08a' stop-opacity='0'/></radialGradient></defs><rect width='600' height='600' fill='url(%23g1)'/><circle cx='300' cy='240' r='200' fill='url(%23spot)'/><text x='300' y='280' font-family='sans-serif' font-size='60' text-anchor='middle' fill='%23ffffff'>✨</text><text x='300' y='360' font-family='serif' font-size='28' font-weight='bold' text-anchor='middle' fill='%23f8fafc'>Pierwszy Taniec</text><text x='300' y='400' font-family='sans-serif' font-size='18' text-anchor='middle' fill='%23cbd5e1'>Kasia &amp; Tomek</text></svg>",
		rawUrl:
			"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='1200' height='800' fill='%231e293b'/></svg>",
	},
	{
		id: "media-2",
		uploaderName: "Wujek Staszek",
		fileType: "video",
		mimeType: "video/mp4",
		originalFileName: "toast_i_zyczenia.mp4",
		fileSize: 15728640,
		status: "ready",
		createdAt: "2026-09-12T18:15:00.000Z",
		thumbUrl:
			"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><defs><linearGradient id='g2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%2378350f'/><stop offset='50%' stop-color='%23b45309'/><stop offset='100%' stop-color='%23451a03'/></linearGradient></defs><rect width='600' height='600' fill='url(%23g2)'/><text x='300' y='280' font-family='sans-serif' font-size='60' text-anchor='middle' fill='%23ffffff'>🥂</text><text x='300' y='360' font-family='serif' font-size='28' font-weight='bold' text-anchor='middle' fill='%23fef3c7'>Toast Weselny</text><text x='300' y='400' font-family='sans-serif' font-size='18' text-anchor='middle' fill='%23fde68a'>Gromkie Sto Lat!</text></svg>",
		rawUrl:
			"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='1200' height='800' fill='%2378350f'/></svg>",
	},
	{
		id: "media-3",
		uploaderName: "Kuzyn Bartek",
		fileType: "image",
		mimeType: "image/jpeg",
		originalFileName: "tort_weselny.jpg",
		fileSize: 5242880,
		status: "ready",
		createdAt: "2026-09-12T20:00:00.000Z",
		thumbUrl:
			"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><defs><linearGradient id='g3' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23831843'/><stop offset='50%' stop-color='%23be185d'/><stop offset='100%' stop-color='%23500724'/></linearGradient></defs><rect width='600' height='600' fill='url(%23g3)'/><text x='300' y='280' font-family='sans-serif' font-size='60' text-anchor='middle' fill='%23ffffff'>🎂</text><text x='300' y='360' font-family='serif' font-size='28' font-weight='bold' text-anchor='middle' fill='%23fdf2f8'>Tort Weselny</text><text x='300' y='400' font-family='sans-serif' font-size='18' text-anchor='middle' fill='%23fbcfe8'>Krojenie tortu</text></svg>",
		rawUrl:
			"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='1200' height='800' fill='%23831843'/></svg>",
	},
	{
		id: "media-4",
		uploaderName: "Ciocia Halinka",
		fileType: "image",
		mimeType: "image/jpeg",
		originalFileName: "zimne_ognie.jpg",
		fileSize: 3145728,
		status: "ready",
		createdAt: "2026-09-12T22:30:00.000Z",
		thumbUrl:
			"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><defs><linearGradient id='g4' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23064e3b'/><stop offset='50%' stop-color='%23047857'/><stop offset='100%' stop-color='%23022c22'/></linearGradient></defs><rect width='600' height='600' fill='url(%23g4)'/><text x='300' y='280' font-family='sans-serif' font-size='60' text-anchor='middle' fill='%23ffffff'>✨</text><text x='300' y='360' font-family='serif' font-size='28' font-weight='bold' text-anchor='middle' fill='%23ecfdf5'>Zimne Ognie</text><text x='300' y='400' font-family='sans-serif' font-size='18' text-anchor='middle' fill='%23a7f3d0'>Pamiątka o północy</text></svg>",
		rawUrl:
			"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='1200' height='800' fill='%23064e3b'/></svg>",
	},
];

async function main() {
	const rootDir = process.cwd().includes("apps")
		? path.resolve(process.cwd(), "../..")
		: process.cwd();
	const outputDir = path.resolve(rootDir, "docs/screenshots");
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	console.log("Uruchamianie Microsoft Edge...");
	const browser = await chromium.launch({
		channel: "msedge",
		headless: true,
	});

	try {
		// 1. Widok Gościa (Mobile - iPhone 14)
		console.log("1. Przechwytywanie widoku galerii gościa (Mobile)...");
		const mobileContext = await browser.newContext({
			viewport: { width: 390, height: 844 },
			deviceScaleFactor: 2,
			isMobile: true,
			hasTouch: true,
			ignoreHTTPSErrors: true,
		});

		const guestPage = await mobileContext.newPage();
		// Mockujemy media, by galeria wyglądała estetycznie i reprezentatywnie
		await guestPage.route(
			"**/api/gallery/kasia-i-tomek/media*",
			async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ media: MOCK_WEDDING_MEDIA }),
				});
			},
		);

		await guestPage.goto("https://localhost/g/kasia-i-tomek", {
			waitUntil: "networkidle",
		});
		await guestPage.waitForTimeout(800);
		await guestPage.screenshot({
			path: path.join(outputDir, "01-guest-gallery-mobile.png"),
			fullPage: false,
		});
		console.log("✓ 01-guest-gallery-mobile.png");

		// 2. Drawer wrzucania zdjęć (Mobile Upload Drawer)
		console.log("2. Przechwytywanie upload drawera...");
		const uploadBtn = guestPage.getByRole("button", {
			name: /Dodaj zdjęcia/i,
		});
		if (await uploadBtn.isVisible()) {
			await uploadBtn.click();
			await guestPage.waitForTimeout(500);
			await guestPage.screenshot({
				path: path.join(outputDir, "02-upload-drawer-mobile.png"),
				fullPage: false,
			});
			console.log("✓ 02-upload-drawer-mobile.png");
		}
		await mobileContext.close();

		// Kontekst Desktop (1366x820)
		const desktopContext = await browser.newContext({
			viewport: { width: 1366, height: 820 },
			deviceScaleFactor: 2,
			ignoreHTTPSErrors: true,
		});

		// 3. Kreator karteczek na stół (A6 Card Generator)
		console.log("3. Przechwytywanie generatora winietek A6...");
		const cardPage = await desktopContext.newPage();
		await cardPage.goto("https://localhost/g/kasia-i-tomek/card", {
			waitUntil: "networkidle",
		});
		await cardPage.waitForTimeout(800);
		await cardPage.screenshot({
			path: path.join(outputDir, "03-table-card-creator.png"),
			fullPage: false,
		});
		console.log("✓ 03-table-card-creator.png");
		await cardPage.close();

		// 4. Panel Pary Młodej (Owner Dashboard)
		console.log("4. Przechwytywanie panelu Pary Młodej...");
		const ownerPage = await desktopContext.newPage();
		await ownerPage.route(
			"**/api/gallery/kasia-i-tomek/media*",
			async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ media: MOCK_WEDDING_MEDIA }),
				});
			},
		);
		await ownerPage.goto("https://localhost/owner/kasia-i-tomek", {
			waitUntil: "networkidle",
		});
		const ownerPwdInput = ownerPage.locator("input[type='password']");
		if (await ownerPwdInput.isVisible()) {
			await ownerPwdInput.fill("wesele2026");
			await ownerPage.getByRole("button", { name: "Zaloguj się" }).click();
			await ownerPage.waitForTimeout(1500);
		}
		await ownerPage.screenshot({
			path: path.join(outputDir, "04-owner-dashboard.png"),
			fullPage: false,
		});
		console.log("✓ 04-owner-dashboard.png");
		await ownerPage.close();

		// 5. Panel Administratora
		console.log("5. Przechwytywanie panelu Administratora...");
		const adminPage = await desktopContext.newPage();
		await adminPage.goto("https://localhost/admin", {
			waitUntil: "networkidle",
		});
		const adminLoginInput = adminPage.locator("input[type='text']");
		if (await adminLoginInput.isVisible()) {
			await adminLoginInput.fill("admin");
			const adminPwd = adminPage.locator("input[type='password']");
			await adminPwd.fill("admin123");
			await adminPage.getByRole("button", { name: "Zaloguj się" }).click();
			await adminPage.waitForTimeout(1500);
		}
		await adminPage.screenshot({
			path: path.join(outputDir, "05-admin-panel.png"),
			fullPage: false,
		});
		console.log("✓ 05-admin-panel.png");
		await adminPage.close();

		await desktopContext.close();
		console.log(
			"Wszystkie zrzuty ekranu pomyślnie zaktualizowane w docs/screenshots/",
		);
	} finally {
		await browser.close();
	}
}

main().catch((err) => {
	console.error("Błąd podczas przechwytywania ekranów:", err);
	process.exit(1);
});
