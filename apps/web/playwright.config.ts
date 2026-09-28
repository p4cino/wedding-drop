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
		locale: "pl-PL", // next-intl renderuje wg Accept-Language; bez tego domyślne en-US Playwrighta łamie asercje polskiego UI
		ignoreHTTPSErrors: true, // Dla lokalnego certyfikatu Caddy
		trace: "on-first-retry",
		screenshot: "only-on-failure",
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
