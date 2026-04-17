import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

const CACHE_TTL = 60; // 1 minute cache

export async function loader({ context, request }: LoaderFunctionArgs) {
  try {
    const kv = context.cloudflare?.env?.SESSIONS as KVNamespace | undefined;

    if (!kv) {
      return Response.json(
        { error: "SESSIONS KV binding not available" },
        { status: 503 }
      );
    }

    const url = new URL(request.url);
    const key = url.searchParams.get("key") || "default";
    const cacheKey = `cache:${key}`;

    // Try to get from KV cache
    const cached = await kv.get(cacheKey);
    if (cached) {
      return Response.json({
        data: JSON.parse(cached),
        cached: true,
        key,
      });
    }

    // Generate fresh data (simulated)
    const freshData = {
      timestamp: new Date().toISOString(),
      key,
      value: `Data for ${key} generated at ${Date.now()}`,
    };

    // Store in KV with TTL
    await kv.put(cacheKey, JSON.stringify(freshData), {
      expirationTtl: CACHE_TTL,
    });

    return Response.json({
      data: freshData,
      cached: false,
      key,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Cache error" },
      { status: 500 }
    );
  }
}
