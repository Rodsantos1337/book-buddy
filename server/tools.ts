import type { OpenLibraryDoc } from "./types";

const BASE = "https://openlibrary.org";

const cache = new Map<string, { data: OpenLibraryDoc[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function searchBooks(query: string, limit = 5): Promise<OpenLibraryDoc[]> {
  const key = query.toLowerCase().trim();

  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  const url = `${BASE}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,first_publish_year,cover_i,subject`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch {
    throw new Error("Book search is temporarily unavailable");
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) throw new Error("Book search is temporarily unavailable");

  const body = await res.json();
  const docs: OpenLibraryDoc[] = (body.docs || []).slice(0, limit);

  cache.set(key, { data: docs, ts: Date.now() });
  return docs;
}

export function toCoverUrl(coverI?: number): string {
  if (!coverI) return "";
  return `https://covers.openlibrary.org/b/id/${coverI}-M.jpg`;
}

export function formatAuthor(names?: string[]): string {
  if (!names || names.length === 0) return "Unknown Author";
  if (names.length === 1) return names[0];
  return names.join(", ");
}
