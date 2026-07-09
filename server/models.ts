import type { Request, Response } from "express";

export async function handleModels(req: Request, res: Response) {
  const baseUrl = req.query.baseUrl as string;
  if (!baseUrl) {
    res.status(400).json({ error: "baseUrl query parameter is required" });
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      res.status(502).json({ error: "Failed to fetch models from provider" });
      return;
    }

    const body = await response.json();
    const models = (body.data || body).map((m: { id: string }) => ({
      id: m.id,
      name: m.id,
    }));

    res.json(models);
  } catch {
    res.status(502).json({ error: "Failed to fetch models from provider" });
  }
}
