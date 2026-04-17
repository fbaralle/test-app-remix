import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";

interface Favorite {
  id: number;
  user_id: string;
  coin_id: string;
  coin_name: string | null;
  coin_symbol: string | null;
  coin_image: string | null;
  created_at: number;
}

export async function loader({ context, request }: LoaderFunctionArgs) {
  try {
    const db = context.cloudflare?.env?.DB as D1Database | undefined;

    if (!db) {
      return Response.json(
        { error: "DB D1 binding not available", favorites: [] },
        { status: 503 }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("user_id") || "public";

    const { results } = await db.prepare(
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
  const method = request.method;

  if (method === "POST") {
    try {
      const db = context.cloudflare?.env?.DB as D1Database | undefined;

      if (!db) {
        return Response.json(
          { error: "DB D1 binding not available" },
          { status: 503 }
        );
      }

      const body = await request.json();
      const {
        user_id = "public",
        coin_id,
        coin_name,
        coin_symbol,
        coin_image
      } = body as {
        user_id?: string;
        coin_id?: string;
        coin_name?: string;
        coin_symbol?: string;
        coin_image?: string;
      };

      if (!coin_id) {
        return Response.json({ error: "coin_id is required" }, { status: 400 });
      }

      await db.prepare(
        "INSERT OR IGNORE INTO favorites (user_id, coin_id, coin_name, coin_symbol, coin_image, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
        .bind(user_id, coin_id, coin_name || null, coin_symbol || null, coin_image || null, Date.now())
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
    try {
      const db = context.cloudflare?.env?.DB as D1Database | undefined;

      if (!db) {
        return Response.json(
          { error: "DB D1 binding not available" },
          { status: 503 }
        );
      }

      const url = new URL(request.url);
      const userId = url.searchParams.get("user_id") || "public";
      const coinId = url.searchParams.get("coin_id");

      if (!coinId) {
        return Response.json({ error: "coin_id is required" }, { status: 400 });
      }

      await db.prepare(
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
