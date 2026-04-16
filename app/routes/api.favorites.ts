import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";

interface Favorite {
  id: number;
  user_id: string;
  coin_id: string;
  created_at: number;
}

export async function loader({ context, request }: LoaderFunctionArgs) {
  const { env } = context.cloudflare;
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id") || "anonymous";

  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC"
    )
      .bind(userId)
      .all<Favorite>();

    return Response.json({ favorites: results });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function action({ context, request }: ActionFunctionArgs) {
  const { env } = context.cloudflare;
  const method = request.method;

  if (method === "POST") {
    try {
      const body = await request.json();
      const { user_id = "anonymous", coin_id } = body as { user_id?: string; coin_id?: string };

      if (!coin_id) {
        return Response.json({ error: "coin_id is required" }, { status: 400 });
      }

      await env.DB.prepare(
        "INSERT OR IGNORE INTO favorites (user_id, coin_id, created_at) VALUES (?, ?, ?)"
      )
        .bind(user_id, coin_id, Date.now())
        .run();

      return Response.json({ success: true, coin_id });
    } catch (e) {
      return Response.json(
        { error: e instanceof Error ? e.message : "Database error" },
        { status: 500 }
      );
    }
  }

  if (method === "DELETE") {
    const url = new URL(request.url);
    const userId = url.searchParams.get("user_id") || "anonymous";
    const coinId = url.searchParams.get("coin_id");

    if (!coinId) {
      return Response.json({ error: "coin_id is required" }, { status: 400 });
    }

    try {
      await env.DB.prepare(
        "DELETE FROM favorites WHERE user_id = ? AND coin_id = ?"
      )
        .bind(userId, coinId)
        .run();

      return Response.json({ success: true, coin_id: coinId });
    } catch (e) {
      return Response.json(
        { error: e instanceof Error ? e.message : "Database error" },
        { status: 500 }
      );
    }
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
