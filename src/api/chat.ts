import type { ChatRequest, ChatResponse, ModelInfo } from "../types";

export async function sendChat(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchModels(baseUrl: string): Promise<ModelInfo[]> {
  const url = `/api/models?baseUrl=${encodeURIComponent(baseUrl)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}
