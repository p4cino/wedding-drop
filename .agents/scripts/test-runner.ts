#!/usr/bin/env node
/**
 * WeddingDrop Test Runner Helper Script
 *
 * Orchestrates test execution for Vitest (unit/integration) and Playwright (E2E).
 *
 * Usage:
 *   npx tsx .agents/scripts/test-runner.ts vitest
 *   npx tsx .agents/scripts/test-runner.ts coverage
 *   npx tsx .agents/scripts/test-runner.ts e2e
 *   npx tsx .agents/scripts/test-runner.ts e2e:docker
 *   npx tsx .agents/scripts/test-runner.ts e2e:mobile
 */

import { execSync } from "node:child_process";

function run(command: string) {
	console.log(`\x1b[36m➜ Executing:\x1b[0m ${command}\n`);
	try {
		execSync(command, { stdio: "inherit" });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.error(`\n\x1b[31m✖ Tests failed:\x1b[0m ${message}`);
		process.exit(1);
	}
}

function printHelp() {
	console.log(`
\x1b[1mWeddingDrop Test Runner CLI\x1b[0m
Usage: npx tsx .agents/scripts/test-runner.ts <command> [options]

\x1b[33mCommands:\x1b[0m
  vitest              Run Vitest unit and integration tests (74 tests)
  coverage            Run Vitest with code coverage report
  e2e                 Run Playwright E2E tests locally
  e2e:mobile          Run Playwright E2E tests for Mobile Safari & Mobile Chrome
  e2e:docker          Run Playwright E2E test suite inside Docker container
  e2e:ui              Open Playwright interactive test UI
  --help              Display this help message
`);
}

function main() {
	const args = process.argv.slice(2);
	const command = args[0];

	if (!command || command === "--help" || command === "-h") {
		printHelp();
		return;
	}

	switch (command) {
		case "vitest":
		case "unit": {
			const extra = args.slice(1).join(" ");
			run(`pnpm turbo run test ${extra}`.trim());
			break;
		}
		case "coverage":
			run("pnpm --filter @wedding-drop/web test:coverage");
			break;
		case "e2e": {
			const extra = args.slice(1).join(" ");
			run(`pnpm --filter @wedding-drop/web test:e2e ${extra}`.trim());
			break;
		}
		case "e2e:mobile":
			run(
				'pnpm --filter @wedding-drop/web exec playwright test --project="Mobile Safari" --project="Mobile Chrome"',
			);
			break;
		case "e2e:docker":
			run(
				`docker run --rm --network wedding-drop_wedding_net ` +
					`-v wedding_playwright_browsers:/ms-playwright ` +
					`-v "\${PWD}:/app" -w /app/apps/web ` +
					`-e BASE_URL=http://wedding_web:3000 ` +
					`mcr.microsoft.com/playwright:v1.50.0-noble npx playwright test`,
			);
			break;
		case "e2e:ui":
			run("pnpm --filter @wedding-drop/web exec playwright test --ui");
			break;
		default:
			console.error(`\x1b[31mUnknown command: ${command}\x1b[0m`);
			printHelp();
			process.exit(1);
	}
}

main();
