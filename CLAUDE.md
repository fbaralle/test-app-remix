# Rules for working in test-app-* repos

This repo is one of **9 sibling apps** that must stay functionally identical across frameworks. Read `CONTEXT.md` for the full list and purpose. These apps exist to test the Webflow Cloud app builder — their value comes from being equivalent, not from being individually optimized.

## Core rule: maintain parity

Any user-visible change (feature, UI, data shape, routing behavior, build config intent) must be applied to **all 9 apps** in the framework-idiomatic equivalent. A change that lands in only one app breaks the test matrix.

Sibling repos live at `../test-app-{framework}` locally (under `webflow-org/test-apps/`). Each has its own remote — changes must be committed and pushed per-repo.

## Branches

Every repo has two long-lived branches, and **parity applies per-branch**:

- **`main`** — vanilla framework output (`npx create-next-app` or equivalent). The clean baseline.
- **`cloudflare-bindings`** — adds wrangler config, binding libs, and glue for Cloudflare D1 / R2 / KV, so Webflow Cloud provisions those resources on deploy.

A change meant for `main` goes to `main` in all 9 repos; a change meant for `cloudflare-bindings` goes to `cloudflare-bindings` in all 9. Never leak `cloudflare-bindings`-only files into `main`. When unsure which branch a change belongs on, ask.

## Before making changes

1. **Ask scope first.** If the user requests a change in one repo, confirm whether it should propagate to the other 8 — unless they've already said so. Don't silently apply across all repos.
2. **Check the source app.** `test-app-next` is the reference implementation. When translating a change to other frameworks, mirror its behavior.
3. **Respect framework equivalents:**
   - Data fetching: TanStack Query (`@tanstack/react-query` / `@tanstack/vue-query` / `@tanstack/svelte-query`)
   - State: React hooks ↔ Vue Composition API ↔ Svelte 5 runes (`$state`, `$effect`)
   - Routing: whatever each framework ships with (Next App Router, Remix, SvelteKit, Nuxt, Astro pages)

## What NOT to do

- **Don't add framework-specific features** (e.g. RSC-only patterns, Svelte-only stores) that can't be mirrored in the other 8.
- **Don't "improve" one app unilaterally.** Refactors, perf tweaks, or dep upgrades in one repo must have a parity plan for the rest.
- **Don't re-add this as a monorepo.** Each repo ships independently to its own GitHub remote for Webflow Cloud deployment. The shared parent folder is local convenience only.
- **Don't change pinned versions or build quirks casually.** Items like Astro 6's `overrides.vite`, Remix's React 18 pin, and the Tailwind v3/v4 split are intentional — see `CONTEXT.md`.

## Verifying changes

After a cross-repo change: build each affected app (`npm run build`) to confirm the builder still succeeds everywhere. That's the whole point of this test harness.
