# Project Context: Crypto Dashboard Multi-Framework Test Apps

## Overview
Created identical crypto dashboard apps across 10 frameworks for Webflow Cloud testing. Each app displays real-time crypto prices from CoinGecko API with features: multi-currency (USD/EUR/GBP), sortable columns, auto-refresh with countdown, sparkline charts, price range bars, and toast notifications.

## Repositories (all under github.com/fbaralle)

Each framework lives in its own repository. Locally they are grouped under `webflow-org/test-apps/` for convenience, but each subdirectory is an independent git repo with its own remote.

| Repo | Framework | Notes |
|------|-----------|-------|
| `test-app-next` | Next.js 16 + React 19 | Source app, Tailwind v4 |
| `test-app-react` | Vite + React 19 | React Query, Tailwind v3 |
| `test-app-js` | Vite + Vanilla JS | No framework, pub/sub store for shared state, Tailwind v3 |
| `test-app-remix` | Remix 2 + React 18 | Downgraded from React 19 due to peer deps |
| `test-app-astro` | Astro 5 + React islands | Tailwind v3 |
| `test-app-astro6` | Astro 6 + React islands | Tailwind v4, requires Node 22+ |
| `test-app-vue` | Vite + Vue 3 | Vue Query, Composition API |
| `test-app-nuxt` | Nuxt 3 + Vue 3 | Vue Query |
| `test-app-svelte` | Vite + Svelte 5 | Svelte runes ($state, $effect) |
| `test-app-sveltekit` | SvelteKit 2 + Svelte 5 | Svelte Query |

## Branches

Each repo has two long-lived branches, both important for testing:

- **`main`** — the vanilla project as it comes out of the box (e.g. `npx create-next-app` for Next.js, the equivalent CLI for each framework). Untouched baseline. The Webflow Cloud app builder should handle this with no Cloudflare-specific config.
- **`cloudflare-bindings`** — adds the config files and libraries needed to provision and bind Cloudflare resources (D1, R2, KV) to the app on deploy. When the builder runs this branch, deployment should create those services in Cloudflare and wire them into the app.

Both branches exist on all 10 repos and must be kept in cross-framework parity: a change intended for `main` goes to `main` in all 10; a change intended for `cloudflare-bindings` goes to `cloudflare-bindings` in all 10. Never cross-contaminate — `cloudflare-bindings`-only files (wrangler config, binding clients, etc.) must not leak into `main`.

## Key Technical Details

- All apps use TanStack Query (React/Vue/Svelte variants), except `test-app-js` which uses a plain pub/sub store
- `test-app-js` is the vanilla-JS/Vite baseline (no framework) — useful for isolating framework-agnostic builder behavior
- Tailwind v3 for most projects, v4 for Next.js and Astro 6
- Astro 6 has `"overrides": { "vite": "^7" }` to fix Vite 8 compatibility
- Astro 6 requires Node 22+ (has .nvmrc file)
- Remix uses React 18 due to @remix-run/react peer dependency
- Remix on `cloudflare-bindings` ships a `.npmrc` with `legacy-peer-deps=true` because `@remix-run/dev@2.x` declares a stale `peerOptional wrangler@^3` that conflicts with the wrangler v4 used by the bindings

## Running Locally

Each project can be run with:
```bash
cd {project}
npm install
npm run dev
```

Every app is expected to work with a **clean, flag-free** npm flow:

- `npm install` (no `--legacy-peer-deps` or `--force` at the command line — if a workaround is needed, bake it into `.npmrc`)
- `npm run dev`
- `npm run build`
- `npm run dev:cf` on the `cloudflare-bindings` branch

Note: Astro 6 requires Node 22+. Use `nvm use` if you have the correct version installed.

## Purpose

These apps exist to test the Webflow Cloud app builder across every supported framework. They must stay functionally identical so manual and automated tests can verify the builder handles each framework correctly.
