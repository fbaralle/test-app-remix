import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

// Patterns to filter out sensitive env var names
const SENSITIVE_PATTERNS = [
  /SECRET/i,
  /KEY/i,
  /TOKEN/i,
  /PASSWORD/i,
  /CREDENTIAL/i,
  /AUTH/i,
  /PRIVATE/i,
  /API_KEY/i,
  /APIKEY/i,
  /ACCESS/i,
  /BEARER/i,
  /JWT/i,
  /CERT/i,
  /SSL/i,
];

function isSensitive(name: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(name));
}

function filterEnvVarNames(names: string[]): string[] {
  return names.filter((name) => !isSensitive(name)).sort();
}

export async function loader({ context }: LoaderFunctionArgs) {
  try {
    // Get env keys from Cloudflare context
    const cloudflareEnv = context.cloudflare?.env || {};
    const allEnvNames = Object.keys(cloudflareEnv);
    const filteredNames = filterEnvVarNames(allEnvNames);

    return Response.json({
      timestamp: new Date().toISOString(),
      environment: "backend",
      total: allEnvNames.length,
      filtered: filteredNames.length,
      hidden: allEnvNames.length - filteredNames.length,
      envVarNames: filteredNames,
    });
  } catch (e) {
    return Response.json(
      {
        timestamp: new Date().toISOString(),
        environment: "backend",
        total: 0,
        filtered: 0,
        hidden: 0,
        envVarNames: [],
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
