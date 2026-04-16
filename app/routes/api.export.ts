import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const { env } = context.cloudflare;
  const url = new URL(request.url);
  const exportId = url.searchParams.get("id");

  if (!exportId) {
    // List recent exports
    try {
      const list = await env.WEBFLOW_CLOUD_MEDIA.list({ prefix: "exports/", limit: 10 });
      const exports = list.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded.toISOString(),
      }));
      return Response.json({ exports });
    } catch (e) {
      return Response.json(
        { error: e instanceof Error ? e.message : "R2 error" },
        { status: 500 }
      );
    }
  }

  // Get specific export
  try {
    const object = await env.WEBFLOW_CLOUD_MEDIA.get(`exports/${exportId}`);
    if (!object) {
      return Response.json({ error: "Export not found" }, { status: 404 });
    }

    const data = await object.text();
    return Response.json({
      id: exportId,
      data: JSON.parse(data),
      metadata: {
        size: object.size,
        uploaded: object.uploaded.toISOString(),
      },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "R2 error" },
      { status: 500 }
    );
  }
}

export async function action({ context, request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { env } = context.cloudflare;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const exportId = `export-${Date.now()}`;
    const exportData = {
      id: exportId,
      createdAt: new Date().toISOString(),
      data: body,
    };

    await env.WEBFLOW_CLOUD_MEDIA.put(
      `exports/${exportId}`,
      JSON.stringify(exportData),
      {
        httpMetadata: {
          contentType: "application/json",
        },
      }
    );

    return Response.json({
      success: true,
      id: exportId,
      url: `/api/export?id=${exportId}`,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "R2 error" },
      { status: 500 }
    );
  }
}
