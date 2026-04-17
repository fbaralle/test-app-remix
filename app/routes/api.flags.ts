import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";

interface FeatureFlags {
  [key: string]: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  dark_mode: true,
  show_favorites: true,
  show_exports: true,
  show_page_views: true,
  experimental_features: false,
};

export async function loader({ context }: LoaderFunctionArgs) {
  try {
    const kv = context.cloudflare?.env?.FLAGS as KVNamespace | undefined;

    if (!kv) {
      return Response.json(
        { error: "FLAGS KV binding not available", flags: DEFAULT_FLAGS },
        { status: 503 }
      );
    }

    // Get all flags from KV
    const flags: FeatureFlags = { ...DEFAULT_FLAGS };

    for (const key of Object.keys(DEFAULT_FLAGS)) {
      const value = await kv.get(`flag:${key}`);
      if (value !== null) {
        flags[key] = value === "true";
      }
    }

    return Response.json({ flags });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "KV error", flags: DEFAULT_FLAGS },
      { status: 500 }
    );
  }
}

export async function action({ context, request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const kv = context.cloudflare?.env?.FLAGS as KVNamespace | undefined;

    if (!kv) {
      return Response.json(
        { error: "FLAGS KV binding not available" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as { flag: string; value: boolean };
    const { flag, value } = body;

    if (!flag || typeof value !== "boolean") {
      return Response.json(
        { error: "flag (string) and value (boolean) are required" },
        { status: 400 }
      );
    }

    if (!(flag in DEFAULT_FLAGS)) {
      return Response.json(
        { error: `Unknown flag: ${flag}` },
        { status: 400 }
      );
    }

    await kv.put(`flag:${flag}`, String(value));

    return Response.json({ success: true, flag, value });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "KV error" },
      { status: 500 }
    );
  }
}
