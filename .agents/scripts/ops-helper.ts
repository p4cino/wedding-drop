#!/usr/bin/env node
/**
 * WeddingDrop Operations Helper Script
 *
 * Provides CLI commands for Docker stack management, database backups,
 * restores, and status inspections.
 *
 * Usage:
 *   npx tsx .agents/scripts/ops-helper.ts status
 *   npx tsx .agents/scripts/ops-helper.ts backup
 *   npx tsx .agents/scripts/ops-helper.ts restore <sql-file> <tar-file>
 *   npx tsx .agents/scripts/ops-helper.ts db:push
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function runFile(
	binary: string,
	args: string[],
	options: { inherit?: boolean; input?: Buffer } = {},
) {
	const { inherit = true, input } = options;
	console.log(`\x1b[36m➜ Executing:\x1b[0m ${binary} ${args.join(" ")}`);
	try {
		return execFileSync(binary, args, {
			stdio: input ? ["pipe", "pipe", "inherit"] : inherit ? "inherit" : "pipe",
			encoding: input ? undefined : "utf8",
			input,
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.error(`\x1b[31m✖ Failed executing command:\x1b[0m ${message}`);
		process.exit(1);
	}
}

function printHelp() {
	console.log(`
\x1b[1mWeddingDrop Operations CLI\x1b[0m
Usage: npx tsx .agents/scripts/ops-helper.ts <command> [options]

\x1b[33mCommands:\x1b[0m
  status              Check Docker Compose services and container health
  backup              Create timestamped backups of PostgreSQL and app_data volume
  restore <sql> <tar> Restore database and media volume from given backup files
  db:push             Push schema changes directly to the database via Drizzle Kit
  db:generate         Generate new Drizzle migration files
  logs [service]      View logs (e.g., 'logs web', 'logs postgres', 'logs caddy')
  --help              Display this help message
`);
}

function handleStatus() {
	console.log("\n\x1b[32m=== Docker Compose Services Status ===\x1b[0m");
	runFile("docker", ["compose", "ps"]);
}

function handleBackup() {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
	const backupDir = path.resolve(process.cwd(), "backups");

	if (!fs.existsSync(backupDir)) {
		fs.mkdirSync(backupDir, { recursive: true });
	}

	const sqlFile = path.join(backupDir, `wedding_backup_${timestamp}.sql`);
	const tarFile = path.join(backupDir, `media_backup_${timestamp}.tar.gz`);

	console.log(`\n\x1b[32m=== Creating PostgreSQL Backup ===\x1b[0m`);
	const dumpOutput = execFileSync(
		"docker",
		["exec", "wedding_postgres", "pg_dump", "-U", "wedding", "wedding_drop"],
		{ encoding: "utf8" },
	);
	fs.writeFileSync(sqlFile, dumpOutput, "utf8");
	console.log(`✔ PostgreSQL backup saved to: ${sqlFile}`);

	console.log(`\n\x1b[32m=== Archiving Media Volume (app_data) ===\x1b[0m`);
	runFile("docker", [
		"run",
		"--rm",
		"-v",
		"wedding-drop_app_data:/data",
		"-v",
		`${backupDir}:/backup`,
		"alpine",
		"tar",
		"-czf",
		`/backup/media_backup_${timestamp}.tar.gz`,
		"-C",
		"/data",
		".",
	]);
	console.log(`✔ Media volume backup saved to: ${tarFile}`);

	console.log(`\n\x1b[32m✔ Backup completed successfully!\x1b[0m\n`);
}

function handleRestore(args: string[]) {
	const sqlFile = args[0];
	const tarFile = args[1];

	if (!sqlFile || !tarFile) {
		console.error(
			"\x1b[31mError: Both SQL dump and media TAR file are required for restore.\x1b[0m",
		);
		console.log(
			"Usage: npx tsx .agents/scripts/ops-helper.ts restore <backup.sql> <media.tar.gz>",
		);
		process.exit(1);
	}

	const absSql = path.resolve(process.cwd(), sqlFile);
	const absTar = path.resolve(process.cwd(), tarFile);

	if (!fs.existsSync(absSql)) {
		console.error(`\x1b[31mSQL file not found: ${absSql}\x1b[0m`);
		process.exit(1);
	}
	if (!fs.existsSync(absTar)) {
		console.error(`\x1b[31mMedia TAR file not found: ${absTar}\x1b[0m`);
		process.exit(1);
	}

	console.log(`\n\x1b[33m=== Restoring Database from ${sqlFile} ===\x1b[0m`);
	const sqlContent = fs.readFileSync(absSql);
	runFile(
		"docker",
		[
			"exec",
			"-i",
			"wedding_postgres",
			"psql",
			"-U",
			"wedding",
			"-d",
			"wedding_drop",
		],
		{ input: sqlContent },
	);

	console.log(`\n\x1b[33m=== Restoring Media Files from ${tarFile} ===\x1b[0m`);
	const tarDir = path.dirname(absTar);
	const tarName = path.basename(absTar);
	if (!/^[a-zA-Z0-9._-]+$/.test(tarName)) {
		console.error(`\x1b[31mInvalid archive filename: ${tarName}\x1b[0m`);
		process.exit(1);
	}
	runFile("docker", [
		"run",
		"--rm",
		"-v",
		"wedding-drop_app_data:/data",
		"-v",
		`${tarDir}:/backup`,
		"alpine",
		"tar",
		"-xzf",
		`/backup/${tarName}`,
		"-C",
		"/data",
	]);

	console.log(`\n\x1b[32m✔ Restore completed successfully!\x1b[0m\n`);
}

function main() {
	const args = process.argv.slice(2);
	const command = args[0];

	if (!command || command === "--help" || command === "-h") {
		printHelp();
		return;
	}

	switch (command) {
		case "status":
			handleStatus();
			break;
		case "backup":
			handleBackup();
			break;
		case "restore":
			handleRestore(args.slice(1));
			break;
		case "db:push":
			runFile("pnpm", ["--filter", "@wedding-drop/db", "db:push"]);
			break;
		case "db:generate":
			runFile("pnpm", ["--filter", "@wedding-drop/db", "db:generate"]);
			break;
		case "logs": {
			const service = args[1] || "";
			if (service && !/^[a-z0-9_-]+$/i.test(service)) {
				console.error(`\x1b[31mInvalid service name: ${service}\x1b[0m`);
				process.exit(1);
			}
			const logArgs = ["compose", "logs", "-f"];
			if (service) logArgs.push(service);
			runFile("docker", logArgs);
			break;
		}
		default:
			console.error(`\x1b[31mUnknown command: ${command}\x1b[0m`);
			printHelp();
			process.exit(1);
	}
}

main();
