// scripts/check-coverage.js
// This script verifies that all packages in the monorepo meet the 80% coverage requirement.
const fs = require("node:fs");
const path = require("node:path");

const packages = [
	{
		name: "@wedding-drop/db",
		dir: path.resolve(__dirname, "..", "packages", "db"),
	},
	{
		name: "@wedding-drop/media",
		dir: path.resolve(__dirname, "..", "packages", "media"),
	},
	{
		name: "@wedding-drop/web",
		dir: path.resolve(__dirname, "..", "apps", "web"),
	},
];

let hasFailures = false;

console.log("\n========================================================");
console.log("       MONOREPO COVERAGE VERIFICATION (>= 80%)          ");
console.log("========================================================\n");

for (const pkg of packages) {
	const summaryPath = path.join(pkg.dir, "coverage", "coverage-summary.json");
	if (!fs.existsSync(summaryPath)) {
		console.error(
			`❌ [${pkg.name}] Plik podsumowania nie istnieje: ${summaryPath}`,
		);
		hasFailures = true;
		continue;
	}

	const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
	const total = summary.total;
	if (!total) {
		console.error(`❌ [${pkg.name}] Brak sekcji 'total' w ${summaryPath}`);
		hasFailures = true;
		continue;
	}

	const metrics = {
		statements: total.statements.pct,
		branches: total.branches.pct,
		functions: total.functions.pct,
		lines: total.lines.pct,
	};

	const passed =
		metrics.statements >= 80 &&
		metrics.branches >= 80 &&
		metrics.functions >= 80 &&
		metrics.lines >= 80;

	if (passed) {
		console.log(`✅ [${pkg.name}] SPEŁNIA WYMAGANIE 80%:`);
	} else {
		console.error(`❌ [${pkg.name}] NIE SPEŁNIA PROGU 80%:`);
		hasFailures = true;
	}

	console.log(
		`   - Statements : ${metrics.statements}% ${metrics.statements >= 80 ? "✓" : "✗"}`,
	);
	console.log(
		`   - Branches   : ${metrics.branches}% ${metrics.branches >= 80 ? "✓" : "✗"}`,
	);
	console.log(
		`   - Functions  : ${metrics.functions}% ${metrics.functions >= 80 ? "✓" : "✗"}`,
	);
	console.log(
		`   - Lines      : ${metrics.lines}% ${metrics.lines >= 80 ? "✓" : "✗"}\n`,
	);
}

if (hasFailures) {
	console.error("❌ Weryfikacja pokrycia testami zakończona NIEPOWODZENIEM!");
	process.exit(1);
} else {
	console.log(
		"🎉 Wszystkie pakiety monorepo pomyślnie osiągnęły pokrycie powyżej 80%!",
	);
	process.exit(0);
}
