import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ context, request }: LoaderFunctionArgs) {
  try {
    const r2 = context.cloudflare?.env?.MEDIA as R2Bucket | undefined;

    if (!r2) {
      return Response.json(
        { error: "MEDIA R2 binding not available", exports: [] },
        { status: 503 }
      );
    }

    const url = new URL(request.url);
    const exportId = url.searchParams.get("id");

    if (!exportId) {
      // List recent exports
      const list = await r2.list({ prefix: "exports/", limit: 10 });
      const exports = list.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded.toISOString(),
      }));
      return Response.json({ exports });
    }

    // Get specific export
    const object = await r2.get(`exports/${exportId}`);
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

  try {
    const r2 = context.cloudflare?.env?.MEDIA as R2Bucket | undefined;

    if (!r2) {
      return Response.json(
        { error: "MEDIA R2 binding not available" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const exportId = `export-${Date.now()}`;
    const exportData = {
      id: exportId,
      createdAt: new Date().toISOString(),
      data: body,
    };

    await r2.put(
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
