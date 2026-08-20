import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchBooks, searchGoogleBooks, toCoverUrl, formatAuthor } from "./tools";
import type { OpenLibraryDoc } from "./types";

describe("formatAuthor", () => {
  it("returns 'Unknown Author' when no names are provided", () => {
    expect(formatAuthor()).toBe("Unknown Author");
    expect(formatAuthor([])).toBe("Unknown Author");
  });

  it("returns the single author name as-is", () => {
    expect(formatAuthor(["Ursula K. Le Guin"])).toBe("Ursula K. Le Guin");
  });

  it("joins multiple authors with a comma", () => {
    expect(formatAuthor(["Ann Leckie", "John Scalzi"])).toBe("Ann Leckie, John Scalzi");
  });
});

describe("toCoverUrl", () => {
  it("returns an empty string when no cover id exists", () => {
    expect(toCoverUrl()).toBe("");
    expect(toCoverUrl(undefined)).toBe("");
  });

  it("builds the medium cover URL from a cover id", () => {
    expect(toCoverUrl(123456)).toBe("https://covers.openlibrary.org/b/id/123456-M.jpg");
  });
});

describe("searchBooks", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns book docs from the Open Library API when no Google key is provided", async () => {
    const docs: OpenLibraryDoc[] = [
      { key: "/books/1", title: "The Dispossessed" },
      { key: "/books/2", title: "Left Hand of Darkness" },
    ];
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ docs }),
    });

    const result = await searchBooks("le guin", 5);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("The Dispossessed");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("openlibrary.org/search.json?q=le%20guin"),
      expect.anything(),
    );
  });

  it("returns book docs from Google Books when a key is provided", async () => {
    const docs = [
      {
        id: "abc123",
        volumeInfo: { title: "The Dispossessed", authors: ["Ursula K. Le Guin"] },
      },
    ];
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: docs }),
    });

    const result = await searchBooks("le guin", 5, "test-key");
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("google-abc123");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("googleapis.com/books/v1/volumes?q=le%20guin"),
      expect.anything(),
    );
  });

  it("throws a friendly error when the API is unreachable", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network failure"));

    await expect(searchBooks("test")).rejects.toThrow("Book search is temporarily unavailable");
  });

  it("serves cached results without hitting the API again", async () => {
    const docs: OpenLibraryDoc[] = [{ key: "/books/1", title: "Dune" }];
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ docs }),
    });

    await searchBooks("Dune");
    await searchBooks("Dune");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reuses the cache across differently-formatted queries", async () => {
    const docs: OpenLibraryDoc[] = [{ key: "/books/2", title: "Neuromancer" }];
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ docs }),
    });

    await searchBooks("  Neuromancer! ");
    await searchBooks("neuromancer");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not share cached results across providers", async () => {
    const googleDocs = [{ id: "g1", volumeInfo: { title: "Snow Crash", authors: ["Neal Stephenson"] } }];
    const openDocs: OpenLibraryDoc[] = [{ key: "/books/1", title: "Snow Crash" }];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: googleDocs }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ docs: openDocs }),
    });

    await searchBooks("Snow Crash", 5, "test-key");
    await searchBooks("Snow Crash");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("searchGoogleBooks", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps Google volume metadata into normalized docs", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "abc123",
            volumeInfo: {
              title: "The Dispossessed",
              authors: ["Ursula K. Le Guin"],
              publishedDate: "1974-03-01",
              categories: ["Fiction"],
              imageLinks: {
                thumbnail: "https://books.google.com/books/content?id=abc123&printsec=frontcover&zoom=1",
              },
            },
          },
        ],
      }),
    });

    const result = await searchGoogleBooks("dispossessed", 5, "test-key");

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("google-abc123");
    expect(result[0].title).toBe("The Dispossessed");
    expect(result[0].author_name).toEqual(["Ursula K. Le Guin"]);
    expect(result[0].first_publish_year).toBe(1974);
    expect(result[0].subject).toEqual(["Fiction"]);
    expect(result[0].coverUrl).toContain("zoom=2");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("googleapis.com/books/v1/volumes?q=dispossessed"),
      expect.anything(),
    );
  });

  it("handles volumes without metadata", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ id: "missing" }] }),
    });

    const result = await searchGoogleBooks("missing", 5, "test-key");
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("google-missing");
    expect(result[0].title).toBe("Untitled");
    expect(result[0].coverUrl).toBe("");
  });
});

describe("searchBooks fallback", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back to Open Library when Google Books fails", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("401 Unauthorized")).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        docs: [{ key: "/books/1", title: "The Dispossessed", author_name: ["Ursula K. Le Guin"] }],
      }),
    });

    const result = await searchBooks("dispossessed", 5, "test-key");

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("/books/1");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports the friendly error when both providers fail", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network failure"));

    await expect(searchBooks("test", 5, "test-key")).rejects.toThrow("Book search is temporarily unavailable");
  });
});
