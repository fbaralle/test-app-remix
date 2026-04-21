# Rules for working in test-app-* repos

This repo is one of **10 sibling apps** that must stay functionally identical across frameworks. Read `CONTEXT.md` for the full list and purpose. These apps exist to test the Webflow Cloud app builder — their value comes from being equivalent, not from being individually optimized.

## Core rule: maintain parity

Any user-visible change (feature, UI, data shape, routing behavior, build config intent) must be applied to **all 10 apps** in the framework-idiomatic equivalent. A change that lands in only one app breaks the test matrix.

Sibling repos live at `../test-app-{framework}` locally (under `webflow-org/test-apps/`). Each has its own remote — changes must be committed and pushed per-repo.

## Branches

Every repo has two long-lived branches, and **parity applies per-branch**:

- **`main`** — vanilla framework output (`npx create-next-app` or equivalent). The clean baseline.
- **`cloudflare-bindings`** — adds wrangler config, binding libs, and glue for Cloudflare D1 / R2 / KV, so Webflow Cloud provisions those resources on deploy.

A change meant for `main` goes to `main` in all 10 repos; a change meant for `cloudflare-bindings` goes to `cloudflare-bindings` in all 10. Never leak `cloudflare-bindings`-only files into `main`. When unsure which branch a change belongs on, ask.

## Before making changes

1. **Ask scope first.** If the user requests a change in one repo, confirm whether it should propagate to the other 9 — unless they've already said so. Don't silently apply across all repos.
2. **Check the source app.** `test-app-next` is the reference implementation. When translating a change to other frameworks, mirror its behavior.
3. **Respect framework equivalents:**
   - Data fetching: TanStack Query (`@tanstack/react-query` / `@tanstack/vue-query` / `@tanstack/svelte-query`)
   - State: React hooks ↔ Vue Composition API ↔ Svelte 5 runes (`$state`, `$effect`)
   - Routing: whatever each framework ships with (Next App Router, Remix, SvelteKit, Nuxt, Astro pages)

## What NOT to do

- **Don't add framework-specific features** (e.g. RSC-only patterns, Svelte-only stores) that can't be mirrored in the other 9.
- **Don't "improve" one app unilaterally.** Refactors, perf tweaks, or dep upgrades in one repo must have a parity plan for the rest.
- **Don't re-add this as a monorepo.** Each repo ships independently to its own GitHub remote for Webflow Cloud deployment. The shared parent folder is local convenience only.
- **Don't change pinned versions or build quirks casually.** Items like Astro 6's `overrides.vite`, Remix's React 18 pin, and the Tailwind v3/v4 split are intentional — see `CONTEXT.md`.

## Build health contract

Every app must work with a **clean, flag-free** npm flow on each branch:

- `npm install` — no `--legacy-peer-deps`, no `--force` flags. If an upstream peer-dep conflict makes that impossible (e.g. Remix 2's stale `wrangler` peer), bake the workaround into the repo (`.npmrc` with `legacy-peer-deps=true`) so `npm install` still works out of the box.
- `npm run dev` — starts the dev server.
- `npm run build` — produces a successful production build.
- `npm run dev:cf` (on `cloudflare-bindings` branch only) — runs the build + `wrangler pages dev` flow locally against the bindings.

A change that breaks any of these on any repo is not done. Before declaring a cross-repo change complete, verify at minimum `npm install` and `npm run build` on every affected repo/branch.

## Verifying changes

After a cross-repo change: run the build-health contract above on each affected app. That's the whole point of this test harness — if the vanilla npm flow doesn't work, the Webflow Cloud builder's test signal is meaningless.
