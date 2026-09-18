# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Read `AGENTS.md` first.** It is this repo's architecture constitution (hardware constraints, security rules, mobile UX rules, docs policy) and applies to all code changes here; this file adds the commands and big-picture map AGENTS.md doesn't spell out. `DOCUMENTATION.md` (Polish) has the full DB schema, API endpoint list, and sequence diagram if you need more detail than below.

## What this is

WeddingDrop is a self-hosted, multi-tenant web app for collecting wedding photos/videos from guests via QR code (guests upload with no login/app install). Target deployment is a low-power **Intel N100** mini-PC running entirely in Docker (Caddy + Node/Next.js + Postgres). Docs and UI strings are in Polish.

## Commands

Package manager is **pnpm only** — never `npm`/`yarn`. Repo is a Turborepo (`turbo.json`) with 3 workspace packages: `apps/web`, `packages/db`, `packages/media`.

```bash
pnpm install                 # install all workspaces

pnpm dev                     # turbo run dev (apps/web: tsx watch server.ts)
pnpm build                   # turbo run build (apps/web: tsup + next build)

pnpm lint                    # biome check . (repo-wide)
pnpm format                  # biome format --write .

pnpm test                    # turbo run test (vitest, all packages)
pnpm test:coverage           # vitest run --coverage, all packages
node scripts/check-coverage.js   # verify each package's coverage-summary.json meets 80% (run after test:coverage)
pnpm test:e2e                 # playwright test in apps/web (Desktop Chromium, Mobile Chrome, Mobile Safari)

pnpm db:push                 # turbo run db:push (drizzle-kit push, packages/db)
pnpm db:generate             # turbo run db:generate (drizzle-kit generate, packages/db)
```

Per-package / single-test invocations (turbo filters don't expose file-level granularity):

```bash
pnpm --filter @wedding-drop/db test              # one package's vitest suite
pnpm --filter @wedding-drop/db exec vitest run tests/schema.test.ts   # single file
pnpm --filter @wedding-drop/web exec vitest run -t "test name"        # single test by name
pnpm --filter @wedding-drop/web exec playwright test e2e/guest-journey.spec.ts   # single E2E spec
pnpm --filter <pkg> check-types                  # tsc --noEmit for one package
```

Husky hooks: `pre-commit` runs `lint-staged` (biome check --write on staged files); `pre-push` runs `pnpm test && pnpm build` — both must pass locally before a push will succeed.

Docker: `docker compose up -d --build` runs the full stack (`wedding_postgres`, `wedding_web`, `wedding_caddy`). CI/sandboxed test runs use `docker run --rm -v "${PWD}:/app" -w /app node:24-alpine sh -c "corepack enable && pnpm -r test"`.

## Architecture

**apps/web (`@wedding-drop/web`)** — Next.js 16 App Router, but it does *not* run via plain `next start`. `apps/web/server.ts` is a custom unified server: it initializes the DB, recovers interrupted Google Drive exports, boots the TUS upload server, calls `app.prepare()`, then creates one `node:http` server that routes `/api/upload/tus/*` to the TUS handler and everything else to the Next.js request handler. It's bundled with `tsup` for production (`tsup.config.ts` → `dist/server.js`) alongside `next build`. Route handlers live under `src/app/api/**/route.ts` (admin, owner, gallery, auth/google, trace). Client components (Lightbox, upload drawer, owner moderation grid) are the exception to Next's server-first default — see AGENTS.md §5.

**packages/db (`@wedding-drop/db`)** — Drizzle ORM. `src/schema.ts` defines 5 tables (`galleries`, `media_items`, `gallery_gdrive_exports`, `card_settings`, `admins`); `src/client.ts` holds the connection pool singleton and `initDatabase()`/admin bootstrap; `src/validators.ts` has Zod schemas via drizzle-zod. Migrations are in `migrations/`, generated with `db:generate`, applied with `db:push`/`db:migrate`. Two composite indexes on `media_items` (`gallery_id, status, created_at DESC` and `gallery_id, file_size`) back the hot gallery/stats queries — don't touch without an `EXPLAIN ANALYZE`.

**packages/media (`@wedding-drop/media`)** — the processing pipeline: `tus-server.ts` (resumable uploads), `media-processor.ts` (p-queue dispatcher for Sharp thumbnailing / FFmpeg frame extraction), `sse-bus.ts` (event bus), `pdf-card.ts` (A6 table-card PDF via pdf-lib), `qr-generator.ts`, `zip-streamer.ts` (archiver-based streamed ZIP), `gdrive-exporter.ts`/`google-drive.ts` (OAuth2 + background export).

**Data flow (guest upload → live gallery update):** guest uploads via `tus-js-client` (5MB chunks, relative endpoint, auto-resume) → TUS `POST_FINISH` hook moves the file from `tus_temp` into `/data/galleries/{slug}/raw/` and enqueues a job on the shared `p-queue` (concurrency 2) → Sharp (images) or FFmpeg-with-watchdog (video) produces a WebP thumbnail → a `media_items` row is written with POSIX-normalized paths → the SSE bus, registered as a `globalThis` singleton so it survives Next.js module reloads, emits `new-media`/`media-updated` → connected guest browsers patch their gallery grid live (with a silent 0s/1s/2.5s/5s fallback poll in case the SSE stream drops).

**At the edge:** Caddy (`Caddyfile`) terminates TLS, serves `/media-file/*` directly from the data volume (bypassing Node, with byte-range support), and injects `X-Robots-Tag: noindex` globally. Production images are built multi-stage on `node:24-alpine` via `turbo prune @wedding-drop/web --docker`.

## Non-negotiable constraints

Full rationale is in `AGENTS.md` §3–4 and `.agents/rules/*.md` — headline list:

- `p-queue` concurrency for media processing must stay `2` (4-core N100 target); never process thumbnails/frames unthrottled.
- Every FFmpeg spawn needs a hard 25s timeout that `SIGKILL`s on expiry.
- ZIP downloads stream via `archiver` straight to the response — never buffer a full archive in memory or on disk.
- Any file-serving route must `path.resolve()` and verify the result stays inside the data directory before serving (path traversal).
- Slugs must be sanitized to `^[a-z0-9_-]+$` before touching the filesystem or SQL.
- Signature/token comparisons (HMAC admin/owner auth) must use `crypto.timingSafeEqual` on equal-length buffers.
- `media_items` with `status: "hidden"`/`"deleted"` must never be reachable from unauthenticated guest endpoints.
- DB path columns (`storage_path`, `thumb_path`) always use POSIX separators (`path.posix.join`), even when developing on Windows.

## Code style

Biome is the only linter/formatter — ESLint and Prettier are removed from this repo. Tab indentation, double quotes, imports auto-organized (`biome.json`). TypeScript `strict: true`; avoid `any`.

## Docs policy

This repo expects `README.md` and `DOCUMENTATION.md` to be updated whenever a feature or architectural component changes — see AGENTS.md §7.
