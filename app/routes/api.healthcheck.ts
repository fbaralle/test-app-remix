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

async function checkD1(db: D1Database): Promise<ServiceStatus> {
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

async function checkKV(kv: KVNamespace): Promise<ServiceStatus> {
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

async function checkR2(r2: R2Bucket): Promise<ServiceStatus> {
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
  const { env } = context.cloudflare;

  const [d1, kv_sessions, kv_flags, r2] = await Promise.all([
    checkD1(env.DB),
    checkKV(env.SESSIONS),
    checkKV(env.FLAGS),
    checkR2(env.WEBFLOW_CLOUD_MEDIA),
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
}
