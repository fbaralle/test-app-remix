import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

// Get base path from COSMIC_MOUNT_PATH environment variable
const basePath = process.env.COSMIC_MOUNT_PATH || "/";

// User's custom Vite configuration for Remix
export default defineConfig({
  base: basePath,
  define: {
    'import.meta.env.VITE_API_MOUNT_PATH': JSON.stringify(basePath === "/" ? "" : basePath),
  },
  plugins: [
    remix({
      basename: basePath,
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    sourcemap: true,
    minify: 'esbuild',
  },
  server: {
    port: 3000,
  },
});
