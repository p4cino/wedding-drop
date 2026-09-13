# WeddingDrop 💍 - Agent Guidelines & Architecture Constitution

Welcome to the **WeddingDrop** repository. This document serves as the project's permanent constitution for AI coding agents and human developers.

---

WeddingDrop is a self-hosted, multi-tenant web application designed to collect wedding photos and videos from guests via QR codes. It is structured as a **Turborepo monorepo** managed with **pnpm workspaces** and **Biome**, optimized for domestic low-power microservers (specifically **Intel N100** quad-core mini-PCs) running 100% inside **Docker** with **Caddy** (TLS reverse proxy), **Node.js 24 Alpine / Next.js 16** (App Router & HTTP server), and **PostgreSQL 16** with **Drizzle ORM**.

### Monorepo Packages:
- `apps/web` (`@wedding-drop/web`): Next.js 16 frontend, App Router, server actions, API routes, and unified HTTP server (`server.ts`).
- `packages/db` (`@wedding-drop/db`): Drizzle ORM schema, migrations, connection pool singleton, and admin bootstrap.
- `packages/media` (`@wedding-drop/media`): Media processing pipeline, TUS 1.0.0 server, Sharp & FFmpeg thumbnailing, SSE event bus, PDF A6 table cards, QR codes, streamed ZIPs, and Google Drive exporter.

---

## 2. Monorepo Tooling & Standards

- **Package Manager**: **PNPM only** (`pnpm-workspace.yaml`). Never use `npm` or `yarn`.
- **Linting & Formatting**: **Biome** (`biome.json`). Prettier and ESLint are decommissioned. Use `pnpm biome check apps/ packages/` with tab indentation and double quotes.
- **Orchestration**: **Turborepo** (`turbo.json`). Tasks `build`, `test`, `lint`, `check-types`, `dev` are managed through Turbo.
- **Docker Architecture**: Multi-stage build on `node:24-alpine` utilizing `turbo prune @wedding-drop/web --docker` for minimal production image footprint.

---

## 3. Non-Negotiable Architecture Constraints

Any code changes must strictly adhere to the following hardware and architectural invariants:

### 2.1. Intel N100 Hardware Protection (Anti-DoS)
- **Concurrency Throttling (`concurrency: 2`)**:
  - The Intel N100 has only 4 Gracemont CPU cores.
  - All image thumbnailing (`Sharp`) and video frame extractions (`FFmpeg`) MUST pass through the centralized `p-queue` with `concurrency: 2`.
  - **NEVER** process incoming files concurrently without throttling or spawn unbounded child processes.
- **FFmpeg Watchdog (`25s SIGKILL`)**:
  - Any FFmpeg or external media transcode process MUST be monitored by a hard timeout watchdog (maximum 25 seconds). If a file hangs, kill it with `SIGKILL` to prevent queue starvation.
- **Streamed ZIP Archives**:
  - ZIP creation (e.g. `GET /api/gallery/:slug/zip`) MUST be streamed directly to the HTTP response using `archiver` with `chunked transfer-encoding`.
  - **NEVER** buffer entire gallery archives in memory (RAM) or disk before sending.

### 2.2. Cross-Platform Path Normalization
- Always use POSIX path separators (`/` or `path.posix.join`) for storing paths in the database and emitting URLs to clients, even when developing on Windows.

---

## 4. Security & Privacy Rules

- **Path Traversal Sandboxing**:
  - Any file serving route (such as `/media-file/*` in `apps/web/server.ts`) MUST verify that `path.resolve(targetPath)` resides strictly inside the configured `/data` directory.
  - Reject any path containing `..`, null bytes, or resolving outside the boundary with `403 Forbidden` or `404 Not Found`.
- **Slug Sanitization**:
  - Slugs MUST strictly conform to `^[a-z0-9_-]+$`. Always apply `.toLowerCase().replace(/[^a-z0-9_-]/g, "")`.
- **Timing-Safe HMAC Authentication**:
  - Admin tokens are signed with HMAC-SHA256. Writable comparisons MUST use `crypto.timingSafeEqual` with matching buffer lengths to prevent timing side-channel attacks.
- **Privacy of Hidden Media**:
  - Items with `status: "hidden"` or `status: "deleted"` MUST NOT be returned to unauthenticated guest endpoints.
  - Queries requesting hidden files (`includeHidden=true`) require valid owner password headers or admin tokens.
- **No Search Engine Indexing**:
  - Always preserve `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` headers in Caddy and `<meta name="robots" content="noindex, nofollow, noarchive" />` in HTML templates.

---

## 5. Mobile UX & Real-Time Gallery

- **Guest First (Zero Friction)**:
  - Guests must never be forced to log in, register, or download an app.
- **Touch Swipe & Lightbox Stability**:
  - The fullscreen Lightbox modal MUST support touch swipe gestures (left/right on mobile screens).
  - Background SSE events (`new-media`) MUST NOT reset or disrupt the user's active viewing index in the Lightbox.
- **Resumable Uploads (TUS 1.0.0)**:
  - The client upload drawer uses `tus-js-client` with relative endpoints and automatic retries for shaky wedding hall Wi-Fi/LTE connections.

---

## 6. Skills & Automation Tools

This workspace provides specialized skills and tools in `.agents/`:
- **Skills**:
  - `wedding-qa`: Running Vitest (80 tests across packages) and Playwright E2E test suites (32 scenarios / 96 tests across Desktop and Mobile).
  - `wedding-ops`: Managing Docker Compose, Caddy SSL, Drizzle migrations (`packages/db`), and Backup/Restore.
  - `wedding-media-pipeline`: TUS upload, Sharp/FFmpeg processing, watchdog, SSE event bus (`packages/media`).
  - `wedding-gdrive`: Google Drive OAuth 2.0 and background export workflows (`packages/media`).
  - `thermo-nuclear-code-quality-review`: Rygorystyczny audyt jakości kodu i architektury (zasada 1k linii, redukcja spaghetti, uproszczenia "code judo", czystość warstw i kontraktów typów).
- **Subagents**:
  - `thermo-nuclear-code-quality-review`: Dedykowany subagent do bezkompromisowej analizy diffów, reguły 1000 linii, wykrywania rozrostu spaghetti i architektonicznych uproszczeń kodu.
- **Helper Scripts**:
  - `.agents/scripts/ops-helper.ts`: Quick operations (backup, restore, status) via `npx tsx`.
  - `.agents/scripts/test-runner.ts`: Test orchestration via `npx tsx` / `pnpm`.
  - `.agents/scripts/hook-runner.ts`: Validation hook runner for `hooks.json`.

---

## 7. Documentation Strictness

- **Always Update Docs**: Every time you add a new feature, capability, or architectural component, you MUST update the `README.md` and any relevant documentation files to reflect these changes. Never implement a feature silently without documenting it for the end users and administrators.
