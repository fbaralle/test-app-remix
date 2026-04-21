# Project Context: Crypto Dashboard Multi-Framework Test Apps

## Overview
Created identical crypto dashboard apps across 9 frameworks for Webflow Cloud testing. Each app displays real-time crypto prices from CoinGecko API with features: multi-currency (USD/EUR/GBP), sortable columns, auto-refresh with countdown, sparkline charts, price range bars, and toast notifications.

## Repositories (all under github.com/fbaralle)

Each framework lives in its own repository. Locally they are grouped under `webflow-org/test-apps/` for convenience, but each subdirectory is an independent git repo with its own remote.

| Repo | Framework | Notes |
|------|-----------|-------|
| `test-app-next` | Next.js 16 + React 19 | Source app, Tailwind v4 |
| `test-app-react` | Vite + React 19 | React Query, Tailwind v3 |
| `test-app-remix` | Remix 2 + React 18 | Downgraded from React 19 due to peer deps |
| `test-app-astro` | Astro 5 + React islands | Tailwind v3 |
| `test-app-astro6` | Astro 6 + React islands | Tailwind v4, requires Node 22+ |
| `test-app-vue` | Vite + Vue 3 | Vue Query, Composition API |
| `test-app-nuxt` | Nuxt 3 + Vue 3 | Vue Query |
| `test-app-svelte` | Vite + Svelte 5 | Svelte runes ($state, $effect) |
| `test-app-sveltekit` | SvelteKit 2 + Svelte 5 | Svelte Query |

## Key Technical Details

- All apps use TanStack Query (React/Vue/Svelte variants)
- Tailwind v3 for most projects, v4 for Next.js and Astro 6
- Astro 6 has `"overrides": { "vite": "^7" }` to fix Vite 8 compatibility
- Astro 6 requires Node 22+ (has .nvmrc file)
- Remix uses React 18 due to @remix-run/react peer dependency

## Running Locally

Each project can be run with:
```bash
cd {project}
npm install
npm run dev
```

Note: Astro 6 requires Node 22+. Use `nvm use` if you have the correct version installed.

## Purpose

These apps exist to test the Webflow Cloud app builder across every supported framework. They must stay functionally identical so manual and automated tests can verify the builder handles each framework correctly.
