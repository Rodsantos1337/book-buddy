import type { OpenLibraryDoc } from "./types";

const BASE = "https://openlibrary.org";
const GOOGLE_BASE = "https://www.googleapis.com/books/v1/volumes";

const cache = new Map<string, { data: OpenLibraryDoc[]; ts: number }>();
const inFlight = new Map<string, Promise<OpenLibraryDoc[]>>();
const CACHE_TTL = 15 * 60 * 1000;

function normalizeKey(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) throw new Error(`Search request failed (${res.status})`);
  return res.json();
}

export async function searchOpenLibrary(query: string, limit: number): Promise<OpenLibraryDoc[]> {
  const url = `${BASE}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,first_publish_year,cover_i,subject`;
  const body = (await fetchJson(url)) as { docs?: OpenLibraryDoc[] };
  return (body.docs || []).slice(0, limit);
}

interface GoogleVolume {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    categories?: string[];
    imageLinks?: { thumbnail?: string };
  };
}

function upscaleThumbnail(url?: string): string {
  if (!url) return "";
  return url.replace("zoom=1", "zoom=2");
}

function volumeToDoc(volume: GoogleVolume): OpenLibraryDoc {
  const info = volume.volumeInfo || {};
  const year = info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : undefined;
  return {
    key: `google-${volume.id}`,
    title: info.title || "Untitled",
    author_name: info.authors || [],
    first_publish_year: Number.isNaN(year) ? undefined : year,
    subject: info.categories || [],
    coverUrl: upscaleThumbnail(info.imageLinks?.thumbnail),
  };
}

export async function searchGoogleBooks(query: string, limit: number, apiKey: string): Promise<OpenLibraryDoc[]> {
  const url = `${GOOGLE_BASE}?q=${encodeURIComponent(query)}&maxResults=${limit}&printType=books&key=${encodeURIComponent(apiKey)}`;
  const body = (await fetchJson(url)) as { items?: GoogleVolume[] };
  return (body.items || []).slice(0, limit).map(volumeToDoc);
}

export async function searchBooks(query: string, limit = 5, googleApiKey?: string): Promise<OpenLibraryDoc[]> {
  const key = `${normalizeKey(query)}|${googleApiKey ? "google" : "openlibrary"}`;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const run = (async () => {
    try {
      let docs: OpenLibraryDoc[];
      if (googleApiKey) {
        try {
          docs = await searchGoogleBooks(query, limit, googleApiKey);
        } catch {
          docs = await searchOpenLibrary(query, limit);
        }
      } else {
        docs = await searchOpenLibrary(query, limit);
      }
      cache.set(key, { data: docs, ts: Date.now() });
      return docs;
    } catch {
      throw new Error("Book search is temporarily unavailable");
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, run);
  return run;
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
