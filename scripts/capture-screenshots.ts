import fs from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

// Starannie przygotowane, eleganckie wektory SVG symulujące profesjonalne zdjęcia ślubne
function createWeddingSvg({
	bgGradient,
	icon,
	title,
	subtitle,
	width = 600,
	height = 600,
}: {
	bgGradient: [string, string, string];
	icon: string;
	title: string;
	subtitle: string;
	width?: number;
	height?: number;
}) {
	const [c1, c2, c3] = bgGradient.map((c) => encodeURIComponent(c));
	return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>
		<defs>
			<linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'>
				<stop offset='0%' stop-color='${c1}'/>
				<stop offset='50%' stop-color='${c2}'/>
				<stop offset='100%' stop-color='${c3}'/>
			</linearGradient>
			<radialGradient id='spot' cx='50%' cy='38%' r='42%'>
				<stop offset='0%' stop-color='%23fef08a' stop-opacity='0.4'/>
				<stop offset='100%' stop-color='%23fef08a' stop-opacity='0'/>
			</radialGradient>
		</defs>
		<rect width='${width}' height='${height}' fill='url(%23bg)'/>
		<circle cx='${width / 2}' cy='${height * 0.38}' r='${Math.min(width, height) * 0.35}' fill='url(%23spot)'/>
		<text x='${width / 2}' y='${height * 0.42}' font-family='system-ui, -apple-system, sans-serif' font-size='${Math.min(width, height) * 0.12}' text-anchor='middle'>${icon}</text>
		<text x='${width / 2}' y='${height * 0.6}' font-family='Georgia, serif' font-size='${Math.min(width, height) * 0.055}' font-weight='bold' text-anchor='middle' fill='%23ffffff' letter-spacing='1'>${title}</text>
		<text x='${width / 2}' y='${height * 0.68}' font-family='system-ui, -apple-system, sans-serif' font-size='${Math.min(width, height) * 0.034}' text-anchor='middle' fill='%23fef3c7' letter-spacing='2'>${subtitle}</text>
	</svg>`;
}

const MOCK_WEDDING_MEDIA = [
	{
		id: "media-1",
		uploaderName: "Świadkowa Ania",
		source: "guest",
		fileType: "image",
		mimeType: "image/jpeg",
		originalFileName: "pierwszy_taniec.jpg",
		fileSize: 4194304,
		status: "ready",
		createdAt: "2026-09-12T17:45:00.000Z",
		thumbUrl: createWeddingSvg({
			bgGradient: ["#0f172a", "#1e1b4b", "#312e81"],
			icon: "✨",
			title: "Pierwszy Taniec",
			subtitle: "KASIA &amp; TOMEK",
		}),
		rawUrl: createWeddingSvg({
			bgGradient: ["#0f172a", "#1e1b4b", "#312e81"],
			icon: "✨",
			title: "Pierwszy Taniec Pary Młodej",
			subtitle: "Kasia &amp; Tomek — 12.09.2026",
			width: 1920,
			height: 1080,
		}),
	},
	{
		id: "media-2",
		uploaderName: "Wujek Staszek",
		source: "guest",
		fileType: "video",
		mimeType: "video/mp4",
		originalFileName: "toast_i_zyczenia.mp4",
		fileSize: 15728640,
		status: "ready",
		createdAt: "2026-09-12T18:15:00.000Z",
		thumbUrl: createWeddingSvg({
			bgGradient: ["#451a03", "#78350f", "#92400e"],
			icon: "🥂",
			title: "Toast Weselny",
			subtitle: "GROMKIE STO LAT!",
		}),
		rawUrl: createWeddingSvg({
			bgGradient: ["#451a03", "#78350f", "#92400e"],
			icon: "🥂",
			title: "Toast Weselny",
			subtitle: "Gromkie Sto Lat!",
			width: 1920,
			height: 1080,
		}),
	},
	{
		id: "media-3",
		uploaderName: "Fotograf Tomasz",
		source: "photographer",
		fileType: "image",
		mimeType: "image/jpeg",
		originalFileName: "sesja_w_ogrodzie.jpg",
		fileSize: 6815744,
		status: "ready",
		createdAt: "2026-09-12T19:30:00.000Z",
		thumbUrl: createWeddingSvg({
			bgGradient: ["#064e3b", "#065f46", "#047857"],
			icon: "📷",
			title: "Sesja w Ogrodzie",
			subtitle: "STUDIO FOTO &amp; WIDEO",
		}),
		rawUrl: createWeddingSvg({
			bgGradient: ["#064e3b", "#065f46", "#047857"],
			icon: "📷",
			title: "Sesja w Ogrodzie — Kasia &amp; Tomek",
			subtitle: "Oficjalny reportaż fotografa",
			width: 1920,
			height: 1080,
		}),
	},
	{
		id: "media-4",
		uploaderName: "Świadkowa Ania",
		source: "guest",
		fileType: "image",
		mimeType: "image/jpeg",
		originalFileName: "tort_weselny.jpg",
		fileSize: 5242880,
		status: "ready",
		createdAt: "2026-09-12T20:00:00.000Z",
		thumbUrl: createWeddingSvg({
			bgGradient: ["#831843", "#9d174d", "#be185d"],
			icon: "🎂",
			title: "Tort Weselny",
			subtitle: "SŁODKI MOMENT",
		}),
		rawUrl: createWeddingSvg({
			bgGradient: ["#831843", "#9d174d", "#be185d"],
			icon: "🎂",
			title: "Tort Weselny",
			subtitle: "Krojenie tortu o 20:00",
			width: 1920,
			height: 1080,
		}),
	},
	{
		id: "media-5",
		uploaderName: "Kuzyn Bartek",
		source: "guest",
		fileType: "image",
		mimeType: "image/jpeg",
		originalFileName: "zimne_ognie.jpg",
		fileSize: 3145728,
		status: "ready",
		createdAt: "2026-09-12T22:30:00.000Z",
		thumbUrl: createWeddingSvg({
			bgGradient: ["#0f172a", "#1e293b", "#334155"],
			icon: "🎆",
			title: "Zimne Ognie",
			subtitle: "BLASK O PÓŁNOCY",
		}),
		rawUrl: createWeddingSvg({
			bgGradient: ["#0f172a", "#1e293b", "#334155"],
			icon: "🎆",
			title: "Zimne Ognie o Północy",
			subtitle: "Niezapomniane wspomnienia",
			width: 1920,
			height: 1080,
		}),
	},
];

const MOCK_WISHES = [
	{
		id: "wish-1",
		guestName: "Matrzek & Ewa",
		message:
			"Kasiu, Tomku! Niech każdy wspólny dzień przynosi Wam tyle uśmiechu, ciepła i radości, co ten cudowny wieczór weselny! Bądźcie dla siebie oparciem i najwspanialszymi przyjaciółmi. Sto lat!",
		status: "ready",
		createdAt: "2026-09-12T18:30:00.000Z",
	},
	{
		id: "wish-2",
		guestName: "Babcia Danusia",
		message:
			"Kochani Wnuczkowie, życzę Wam miłości cierpliwej i łaskawej, zdrowia, błogosławieństwa oraz domu zawsze pełnego ciepła i zgody.",
		status: "ready",
		createdAt: "2026-09-12T19:15:00.000Z",
	},
	{
		id: "wish-3",
		guestName: "Ekipa ze studiów",
		message:
			"Najlepsze wesele dekady! Zawsze trzymajcie taki styl i taką energię jak na parkiecie! Cudownej podróży poślubnej!",
		status: "ready",
		createdAt: "2026-09-12T21:00:00.000Z",
	},
];

const MOCK_GALLERY = {
	id: "gal-1",
	slug: "kasia-i-tomek",
	coupleNames: "Kasia & Tomek",
	weddingDate: "12.09.2026",
	isActive: true,
	allowGuestDownloads: true,
	allowVideos: true,
	primaryColor: "#1E293B",
	accentColor: "#D4AF37",
	cardSettings: {
		headline: "Wspomnienia z naszego wesela",
		customInstructions:
			"Zeskanuj kod QR aparatem w telefonie i podziel się z nami swoimi zdjęciami oraz filmami z dzisiejszego wieczoru!",
		primaryColor: "#1E293B",
		accentColor: "#D4AF37",
	},
};

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

async function hideNextDevOverlay(page: Page) {
	await page.addStyleTag({
		content: `
			nextjs-portal,
			[data-nextjs-toast],
			#next-route-announcer,
			[class*="nextjs-dev"],
			div:has(> button[aria-label="Open Next.js Dev Tools"]),
			div[data-nextjs-dev-tools-button="true"],
			button[aria-label="Open Next.js Dev Tools"] {
				display: none !important;
				opacity: 0 !important;
				visibility: hidden !important;
				pointer-events: none !important;
			}
		`,
	});
}

async function enableLiveSseMock(page: Page) {
	// Mockujemy EventSource po stronie przeglądarki, by galeria miała natychmiast status "Na żywo"
	await page.addInitScript(() => {
		class MockEventSource {
			onopen: ((e: any) => void) | null = null;
			onmessage: ((e: any) => void) | null = null;
			onerror: ((e: any) => void) | null = null;
			readyState = 1;
			constructor(_url: string) {
				setTimeout(() => {
					if (this.onopen) {
						this.onopen(new Event("open"));
					}
				}, 50);
			}
			close() {}
		}
		(window as any).EventSource = MockEventSource;
	});
}

async function main() {
	const rootDir = process.cwd().includes("apps")
		? path.resolve(process.cwd(), "../..")
		: process.cwd();
	const outputDir = path.resolve(rootDir, "docs/screenshots");
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	console.log(
		`Uruchamianie Chromium w celu wykonania zrzutów ekranu... (serwer: ${BASE_URL})`,
	);
	const browser = await chromium.launch({
		headless: true,
	});

	try {
		// ==========================================
		// 1. Widok Gościa (Mobile - iPhone 14)
		// ==========================================
		console.log("1. Przechwytywanie galerii gościa na żywo (Mobile)...");
		const mobileContext = await browser.newContext({
			viewport: { width: 390, height: 844 },
			deviceScaleFactor: 2,
			isMobile: true,
			hasTouch: true,
			locale: "pl-PL",
		});

		const guestPage = await mobileContext.newPage();
		await enableLiveSseMock(guestPage);

		// Mock API dla gościa
		await guestPage.route("**/api/gallery/kasia-i-tomek", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(MOCK_GALLERY),
			});
		});
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
		await guestPage.route(
			"**/api/gallery/kasia-i-tomek/wishes*",
			async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ wishes: MOCK_WISHES }),
				});
			},
		);

		await guestPage.goto(`${BASE_URL}/pl/g/kasia-i-tomek`, {
			waitUntil: "networkidle",
		});
		await guestPage.waitForTimeout(600);
		await hideNextDevOverlay(guestPage);
		await guestPage.screenshot({
			path: path.join(outputDir, "01-guest-gallery-mobile.png"),
			fullPage: false,
		});
		console.log(
			"✓ 01-guest-gallery-mobile.png (Galeria gościa z rankingiem TOP 3 i statusem Na żywo)",
		);

		// ==========================================
		// 2. Mobile Upload Drawer z opcją Photobooth
		// ==========================================
		console.log(
			"2. Przechwytywanie upload drawera z opcją aparatu Photobooth...",
		);
		const uploadBtn = guestPage.getByRole("button", {
			name: /Dodaj zdjęcia/i,
		});
		if (await uploadBtn.isVisible()) {
			await uploadBtn.click();
			await guestPage.waitForTimeout(400);
			const signatureInput = guestPage.locator("#uploader-name-input");
			if (await signatureInput.isVisible()) {
				await signatureInput.fill("Wujek Staszek i Ciocia Krysia");
			}
			await hideNextDevOverlay(guestPage);
			await guestPage.screenshot({
				path: path.join(outputDir, "02-upload-drawer-mobile.png"),
				fullPage: false,
			});
			console.log(
				"✓ 02-upload-drawer-mobile.png (Drawer z podpisem i przyciskiem Zrób zdjęcie)",
			);
		}

		// ==========================================
		// 3. Mobile Księga Życzeń (Wishes Book)
		// ==========================================
		console.log("3. Przechwytywanie Księgi Życzeń (Mobile)...");
		const closeDrawerBtn = guestPage.locator("button[title*='Zamknij']");
		if (await closeDrawerBtn.isVisible()) {
			await closeDrawerBtn.click();
			await guestPage.waitForTimeout(300);
		}
		const wishesTab = guestPage.getByRole("tab", { name: /Życzenia/i });
		if (await wishesTab.isVisible()) {
			await wishesTab.click();
			await guestPage.waitForTimeout(500);
			await hideNextDevOverlay(guestPage);
			await guestPage.screenshot({
				path: path.join(outputDir, "03-guest-wishes-mobile.png"),
				fullPage: false,
			});
			console.log(
				"✓ 03-guest-wishes-mobile.png (Księga Życzeń z formularzem i wpisami gości)",
			);
		}
		await mobileContext.close();

		// ==========================================
		// Kontekst Desktop (do widoków TV, Kreatora i Paneli)
		// ==========================================
		const desktopContext = await browser.newContext({
			viewport: { width: 1440, height: 900 },
			deviceScaleFactor: 2,
			locale: "pl-PL",
		});

		// Wspólne mocki dla kontekstu desktopowego
		await desktopContext.route(
			"**/api/gallery/kasia-i-tomek",
			async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify(MOCK_GALLERY),
				});
			},
		);
		await desktopContext.route(
			"**/api/gallery/kasia-i-tomek/media*",
			async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ media: MOCK_WEDDING_MEDIA }),
				});
			},
		);
		await desktopContext.route(
			"**/api/gallery/kasia-i-tomek/wishes*",
			async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ wishes: MOCK_WISHES }),
				});
			},
		);

		// ==========================================
		// 4. Tryb TV na sali weselnej (TV Slideshow)
		// ==========================================
		console.log("4. Przechwytywanie widoku Trybu TV (Pokaz Slajdów)...");
		const tvPage = await desktopContext.newPage();
		await enableLiveSseMock(tvPage);
		await tvPage.goto(`${BASE_URL}/pl/g/kasia-i-tomek/tv`, {
			waitUntil: "networkidle",
		});
		await tvPage.waitForTimeout(800);
		await hideNextDevOverlay(tvPage);
		await tvPage.screenshot({
			path: path.join(outputDir, "04-tv-slideshow.png"),
			fullPage: false,
		});
		console.log("✓ 04-tv-slideshow.png (Tryb TV z pełnym ekranem i kodem QR)");
		await tvPage.close();

		// ==========================================
		// 5. Generator winietek na stół (Format A6)
		// ==========================================
		console.log("5. Przechwytywanie generatora winietek A6...");
		const cardPage = await desktopContext.newPage();
		await cardPage.goto(`${BASE_URL}/pl/g/kasia-i-tomek/card`, {
			waitUntil: "networkidle",
		});
		await cardPage.waitForTimeout(800);
		await hideNextDevOverlay(cardPage);
		await cardPage.screenshot({
			path: path.join(outputDir, "05-table-card-creator.png"),
			fullPage: false,
		});
		// Zachowujemy też kompatybilność wsteczną
		fs.copyFileSync(
			path.join(outputDir, "05-table-card-creator.png"),
			path.join(outputDir, "03-table-card-creator.png"),
		);
		console.log(
			"✓ 05-table-card-creator.png (Generator winietek A6 z podglądem na żywo)",
		);
		await cardPage.close();

		// ==========================================
		// 6. Panel Pary Młodej (Owner Dashboard)
		// ==========================================
		console.log("6. Przechwytywanie panelu Pary Młodej...");
		const ownerPage = await desktopContext.newPage();
		// Zwiększamy nieco wysokość viewportu, by elegancko objąć nagłówek, statystyki, panel fotografa i moderację
		await ownerPage.setViewportSize({ width: 1440, height: 1020 });
		await ownerPage.route(
			"**/api/owner/kasia-i-tomek/session",
			async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						ownerToken: "mock-owner-token",
						gallery: MOCK_GALLERY,
						stats: {
							totalFiles: 5,
							totalBytes: 35147572,
						},
						gdrive: {
							isConnected: false,
						},
					}),
				});
			},
		);

		await ownerPage.goto(`${BASE_URL}/pl/owner/kasia-i-tomek`, {
			waitUntil: "networkidle",
		});
		await ownerPage.waitForTimeout(1000);
		await hideNextDevOverlay(ownerPage);
		await ownerPage.screenshot({
			path: path.join(outputDir, "06-owner-dashboard.png"),
			fullPage: false,
		});
		// Kompatybilność wsteczna
		fs.copyFileSync(
			path.join(outputDir, "06-owner-dashboard.png"),
			path.join(outputDir, "04-owner-dashboard.png"),
		);
		console.log(
			"✓ 06-owner-dashboard.png (Panel Pary Młodej: moderacja, import fotografa, życzenia, TV)",
		);
		await ownerPage.close();

		// ==========================================
		// 7. Panel Administratora
		// ==========================================
		console.log("7. Przechwytywanie panelu Administratora...");
		const adminPage = await desktopContext.newPage();
		await adminPage.setViewportSize({ width: 1440, height: 900 });

		// Mock uwierzytelnienia administratora
		await adminPage.route("**/api/admin/auth", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ adminToken: "mock-admin-token-12345" }),
			});
		});

		// Mock listy galerii
		await adminPage.route("**/api/admin/galleries", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					galleries: [
						{
							id: "1",
							slug: "kasia-i-tomek",
							coupleNames: "Kasia & Tomek",
							weddingDate: "12.09.2026",
							contactEmail: "kasia.tomek@example.com",
							filesCount: 248,
							totalBytes: 1428490188,
							status: "active",
						},
						{
							id: "2",
							slug: "ola-i-michal",
							coupleNames: "Ola & Michał",
							weddingDate: "26.09.2026",
							contactEmail: "ola.michal@example.com",
							filesCount: 112,
							totalBytes: 542113840,
							status: "active",
						},
						{
							id: "3",
							slug: "magda-i-piotr",
							coupleNames: "Magda & Piotr",
							weddingDate: "10.10.2026",
							contactEmail: "magda.piotr@example.com",
							filesCount: 0,
							totalBytes: 0,
							status: "active",
						},
					],
				}),
			});
		});

		await adminPage.goto(`${BASE_URL}/pl/admin`, {
			waitUntil: "networkidle",
		});

		const adminLoginInput = adminPage.locator("input[type='text']");
		if (await adminLoginInput.isVisible()) {
			await adminLoginInput.fill("admin");
			const adminPwd = adminPage.locator("input[type='password']");
			await adminPwd.fill("admin123");
			await adminPage.getByRole("button", { name: "Zaloguj się" }).click();
			// Czekamy na załadowanie tabeli z galeriami
			await adminPage.waitForSelector(
				"table, [role='table'], text=Kasia & Tomek",
				{
					timeout: 5000,
				},
			);
			await adminPage.waitForTimeout(500);
		}

		await hideNextDevOverlay(adminPage);
		await adminPage.screenshot({
			path: path.join(outputDir, "07-admin-panel.png"),
			fullPage: false,
		});
		// Kompatybilność wsteczna
		fs.copyFileSync(
			path.join(outputDir, "07-admin-panel.png"),
			path.join(outputDir, "05-admin-panel.png"),
		);
		console.log(
			"✓ 07-admin-panel.png (Panel Administratora ze statystykami i listą galerii)",
		);
		await adminPage.close();

		await desktopContext.close();
		console.log(
			"Wszystkie zrzuty ekranu pomyślnie zaktualizowane w docs/screenshots/!",
		);
	} finally {
		await browser.close();
	}
}

main().catch((err) => {
	console.error("Błąd podczas przechwytywania ekranów:", err);
	process.exit(1);
});
