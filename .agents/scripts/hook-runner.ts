#!/usr/bin/env node
/**
 * Antigravity Lifecycle Hook Runner for WeddingDrop
 *
 * Implements the Antigravity hook input/output contract:
 * - Reads JSON payload from stdin
 * - Runs requested actions (e.g. Biome formatting after file edits, TypeScript compilation check on stop)
 * - Outputs valid JSON to stdout
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

interface HookPayload {
	conversationId?: string;
	workspacePaths?: string[];
	transcriptPath?: string;
	artifactDirectoryPath?: string;
	modelName?: string;
	stepIdx?: number;
	error?: string;
	terminationReason?: string;
	toolCall?: {
		name?: string;
		args?: Record<string, unknown>;
	};
	tool?: {
		name?: string;
		args?: Record<string, unknown>;
	};
	[key: string]: unknown;
}

function findRepoRoot(startDir: string = process.cwd()): string {
	let current = path.resolve(startDir);
	while (current !== path.dirname(current)) {
		if (
			fs.existsSync(path.join(current, "biome.json")) ||
			fs.existsSync(path.join(current, "pnpm-workspace.yaml"))
		) {
			return current;
		}
		current = path.dirname(current);
	}
	return startDir;
}

async function readStdin(timeoutMs = 1500): Promise<string> {
	if (process.stdin.isTTY) {
		return "";
	}
	return new Promise((resolve) => {
		let data = "";
		let timer: NodeJS.Timeout | null = setTimeout(() => {
			resolve(data);
		}, timeoutMs);

		process.stdin.setEncoding("utf8");
		process.stdin.on("data", (chunk: string) => {
			data += chunk;
		});
		process.stdin.on("end", () => {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			resolve(data);
		});
		process.stdin.on("error", () => {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			resolve(data);
		});
	});
}

function formatWithBiome(repoRoot: string, targetFile?: string): void {
	try {
		if (targetFile && typeof targetFile === "string") {
			const resolvedPath = path.isAbsolute(targetFile)
				? targetFile
				: path.resolve(repoRoot, targetFile);

			// Only format if the file exists and is located inside the repository workspace
			const relative = path.relative(repoRoot, resolvedPath);
			const isInsideRepo =
				!relative.startsWith("..") && !path.isAbsolute(relative);

			if (isInsideRepo && fs.existsSync(resolvedPath)) {
				// Format the specific modified file
				execSync(`pnpm biome format --write "${resolvedPath}"`, {
					cwd: repoRoot,
					stdio: "ignore",
				});
				return;
			}
		}

		// Fallback: format modified files detected via git status
		const gitOutput = execSync("git status --porcelain", {
			cwd: repoRoot,
			encoding: "utf8",
		});
		const modifiedFiles = gitOutput
			.split("\n")
			.map((line) => line.trim().slice(3).trim())
			.filter(Boolean)
			.filter((f) => /\.(ts|tsx|js|jsx|json|css|md)$/.test(f));

		if (modifiedFiles.length > 0) {
			const quoted = modifiedFiles.map((f) => `"${f}"`).join(" ");
			execSync(`pnpm biome format --write ${quoted}`, {
				cwd: repoRoot,
				stdio: "ignore",
			});
			return;
		}

		// Fallback: format workspace
		execSync("pnpm biome format --write .", {
			cwd: repoRoot,
			stdio: "ignore",
		});
	} catch {
		// Non-blocking: formatting failures should not break tool execution
	}
}

async function main() {
	const args = process.argv.slice(2);
	const isDryRun = args.includes("--dry-run");
	const forceTypecheck = args.includes("--typecheck");
	const isFormat = args.includes("--format");

	let payload: HookPayload = {};
	try {
		const rawInput = await readStdin();
		if (rawInput.trim().length > 0) {
			payload = JSON.parse(rawInput);
		}
	} catch {
		// Gracefully handle any stdin parsing error
	}

	if (isDryRun) {
		process.stdout.write(
			`${JSON.stringify({ status: "ok", dryRun: true, parsedPayload: payload })}\n`,
		);
		process.exit(0);
	}

	const repoRoot = findRepoRoot();

	// PostToolUse formatting: run Biome format on edited files
	if (isFormat || (!payload.error && payload.toolCall)) {
		const argsObj = (payload.toolCall?.args ||
			payload.tool?.args ||
			{}) as Record<string, unknown>;
		const targetFile =
			(argsObj.TargetFile as string | undefined) ||
			(argsObj.targetFile as string | undefined) ||
			(argsObj.FilePath as string | undefined) ||
			(argsObj.filePath as string | undefined) ||
			(argsObj.file as string | undefined);

		formatWithBiome(repoRoot, targetFile);
	}

	// Stop hook or explicit --typecheck: run type checking
	if (forceTypecheck || payload.terminationReason) {
		try {
			execSync("pnpm -r check-types", { cwd: repoRoot, stdio: "ignore" });
		} catch {
			// Non-blocking check
		}
	}

	// Antigravity hook protocol requires valid JSON output on stdout
	process.stdout.write(`${JSON.stringify({})}\n`);
	process.exit(0);
}

main().catch((err) => {
	process.stderr.write(`Hook runner error: ${err}\n`);
	process.stdout.write(`${JSON.stringify({})}\n`);
	process.exit(0);
});
