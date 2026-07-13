import type { Context } from "hono";

export async function handleModels(c: Context) {
  const baseUrl = c.req.query("baseUrl");
  if (!baseUrl) {
    return c.json({ error: "baseUrl query parameter is required" }, 400);
  }

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return c.json({ error: "Failed to fetch models from provider" }, 502);
    }

    const body = await response.json();
    const models = (body.data || body).map((m: { id: string }) => ({
      id: m.id,
      name: m.id,
    }));

    return c.json(models);
  } catch {
    return c.json({ error: "Failed to fetch models from provider" }, 502);
  }
}
