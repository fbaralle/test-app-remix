import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

interface ServiceStatus {
  status: "ok" | "error";
  latency: number;
  error?: string;
}

interface HealthcheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    d1: ServiceStatus;
    kv_sessions: ServiceStatus;
    kv_flags: ServiceStatus;
    r2: ServiceStatus;
  };
}

async function checkD1(db: D1Database | undefined): Promise<ServiceStatus> {
  if (!db) {
    return { status: "error", latency: 0, error: "DB binding not available" };
  }
  const start = performance.now();
  try {
    await db.prepare("SELECT 1").first();
    return { status: "ok", latency: Math.round(performance.now() - start) };
  } catch (e) {
    return {
      status: "error",
      latency: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

async function checkKV(kv: KVNamespace | undefined): Promise<ServiceStatus> {
  if (!kv) {
    return { status: "error", latency: 0, error: "KV binding not available" };
  }
  const start = performance.now();
  try {
    await kv.get("__healthcheck__");
    return { status: "ok", latency: Math.round(performance.now() - start) };
  } catch (e) {
    return {
      status: "error",
      latency: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

async function checkR2(r2: R2Bucket | undefined): Promise<ServiceStatus> {
  if (!r2) {
    return { status: "error", latency: 0, error: "R2 binding not available" };
  }
  const start = performance.now();
  try {
    await r2.head("__healthcheck__");
    return { status: "ok", latency: Math.round(performance.now() - start) };
  } catch (e) {
    return {
      status: "error",
      latency: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function loader({ context }: LoaderFunctionArgs) {
  try {
    const db = context.cloudflare?.env?.DB as D1Database | undefined;
    const sessions = context.cloudflare?.env?.SESSIONS as KVNamespace | undefined;
    const flags = context.cloudflare?.env?.FLAGS as KVNamespace | undefined;
    const media = context.cloudflare?.env?.MEDIA as R2Bucket | undefined;

    const [d1, kv_sessions, kv_flags, r2] = await Promise.all([
      checkD1(db),
      checkKV(sessions),
      checkKV(flags),
      checkR2(media),
    ]);

    const services = { d1, kv_sessions, kv_flags, r2 };
    const errorCount = Object.values(services).filter(
      (s) => s.status === "error"
    ).length;

    const status: HealthcheckResponse["status"] =
      errorCount === 0 ? "healthy" : errorCount < 3 ? "degraded" : "unhealthy";

    const response: HealthcheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      services,
    };

    return Response.json(response);
  } catch (e) {
    return Response.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: e instanceof Error ? e.message : "Unknown error",
        services: {
          d1: { status: "error", latency: 0, error: "Check failed" },
          kv_sessions: { status: "error", latency: 0, error: "Check failed" },
          kv_flags: { status: "error", latency: 0, error: "Check failed" },
          r2: { status: "error", latency: 0, error: "Check failed" },
        },
      },
      { status: 500 }
    );
  }
}
