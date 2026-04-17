import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";

const VIEWS_KEY = "pageviews:total";
const UNIQUE_KEY = "pageviews:unique";

export async function loader({ context }: LoaderFunctionArgs) {
  try {
    const kv = context.cloudflare?.env?.SESSIONS as KVNamespace | undefined;

    if (!kv) {
      return Response.json(
        { error: "SESSIONS KV binding not available" },
        { status: 503 }
      );
    }

    const [totalViews, uniqueVisitors] = await Promise.all([
      kv.get(VIEWS_KEY),
      kv.get(UNIQUE_KEY),
    ]);

    return Response.json({
      totalViews: parseInt(totalViews || "0", 10),
      uniqueVisitors: parseInt(uniqueVisitors || "0", 10),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "KV error" },
      { status: 500 }
    );
  }
}

export async function action({ context, request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const kv = context.cloudflare?.env?.SESSIONS as KVNamespace | undefined;

    if (!kv) {
      return Response.json(
        { error: "SESSIONS KV binding not available" },
        { status: 503 }
      );
    }

    // Get visitor ID from request body or generate one
    const body = (await request.json().catch(() => ({}))) as { visitorId?: string };
    const visitorId = body.visitorId || `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Increment total views
    const currentTotal = await kv.get(VIEWS_KEY);
    const newTotal = (parseInt(currentTotal || "0", 10) + 1).toString();
    await kv.put(VIEWS_KEY, newTotal);

    // Check if this is a unique visitor (track for 24 hours)
    const visitorKey = `visitor:${visitorId}`;
    const existingVisitor = await kv.get(visitorKey);

    let isNewVisitor = false;
    if (!existingVisitor) {
      isNewVisitor = true;
      // Mark visitor as seen for 24 hours
      await kv.put(visitorKey, "1", { expirationTtl: 86400 });

      // Increment unique visitors
      const currentUnique = await kv.get(UNIQUE_KEY);
      const newUnique = (parseInt(currentUnique || "0", 10) + 1).toString();
      await kv.put(UNIQUE_KEY, newUnique);
    }

    return Response.json({
      success: true,
      totalViews: parseInt(newTotal, 10),
      isNewVisitor,
      visitorId,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "KV error" },
      { status: 500 }
    );
  }
}
