/// <reference types="@cloudflare/workers-types" />

import type { PlatformProxy } from "wrangler";

interface CloudflareEnv {
  DB: D1Database;
  SESSIONS: KVNamespace;
  FLAGS: KVNamespace;
  MEDIA: R2Bucket;
}

type Cloudflare = Omit<PlatformProxy<CloudflareEnv>, "dispose">;

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Cloudflare;
  }
}

export {};
