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
		extraHTTPHeaders: {
			"accept-language": "pl-PL,pl;q=0.9",
		},
		ignoreHTTPSErrors: true, // Dla lokalnego certyfikatu Caddy
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		// Wymuszenie polskiego locale przeglądarki — next-intl neguje język z nagłówka
		// Accept-Language, a domyślny "en-US" Playwrighta przebija defaultLocale: "pl"
		// z i18n/routing.ts, serwując /en/* zamiast /pl/* i psując cały istniejący
		// (polskojęzyczny) zestaw testów e2e.
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
