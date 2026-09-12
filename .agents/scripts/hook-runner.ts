#!/usr/bin/env node
/**
 * Antigravity Lifecycle Hook Runner for WeddingDrop
 * 
 * Implements the Antigravity hook input/output contract:
 * - Reads JSON payload from stdin
 * - Runs requested verification (e.g., TypeScript compilation check, linting)
 * - Outputs valid JSON to stdout
 */

import { execSync } from "child_process";

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return "";
  }
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("readable", () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        data += chunk;
      }
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const forceTypecheck = args.includes("--typecheck");

  let payload: Record<string, unknown> = {};
  try {
    const rawInput = await readStdin();
    if (rawInput.trim().length > 0) {
      payload = JSON.parse(rawInput);
    }
  } catch {
    // If stdin parsing fails, proceed gracefully
  }

  if (isDryRun) {
    process.stdout.write(JSON.stringify({ status: "ok", dryRun: true, parsedPayload: payload }) + "\n");
    process.exit(0);
  }

  // If invoked as a Stop hook or with --typecheck, perform non-blocking typecheck check
  if (forceTypecheck || payload.terminationReason) {
    try {
      execSync("pnpm -r check-types", { stdio: "ignore" });
    } catch {
      // Non-blocking warning on stop: do not prevent agent exit, but log or output if needed
    }
  }

  // Antigravity hook protocol requires valid JSON output on stdout
  process.stdout.write(JSON.stringify({}) + "\n");
  process.exit(0);
}

main().catch((err) => {
  // Ensure we still output valid JSON even if an unexpected error occurs
  process.stderr.write(`Hook runner error: ${err}\n`);
  process.stdout.write(JSON.stringify({}) + "\n");
  process.exit(0);
});
