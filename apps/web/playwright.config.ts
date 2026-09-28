import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: "html",
	use: {
		baseURL: process.env.BASE_URL || "https://localhost",
		ignoreHTTPSErrors: true, // Dla lokalnego certyfikatu Caddy
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		// Wszystkie scenariusze e2e zakładają domyślną (polską) treść aplikacji.
		// Bez tego next-intl middleware neguje Accept-Language przeglądarki
		// (domyślnie en-US w Playwright) i przekierowuje na /en/..., łamiąc
		// asercje tekstowe pisane po polsku — niezależnie od tej funkcji.
		locale: "pl-PL",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "Mobile Chrome",
			use: { ...devices["Pixel 5"] },
		},
		{
			name: "Mobile Safari",
			use: { ...devices["iPhone 13"] },
		},
	],
});
