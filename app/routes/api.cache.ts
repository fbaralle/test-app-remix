import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

const CACHE_TTL = 60; // 1 minute cache

export async function loader({ context, request }: LoaderFunctionArgs) {
  const { env } = context.cloudflare;
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "default";
  const cacheKey = `cache:${key}`;

  try {
    // Try to get from KV cache
    const cached = await env.SESSIONS.get(cacheKey);
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
    await env.SESSIONS.put(cacheKey, JSON.stringify(freshData), {
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
