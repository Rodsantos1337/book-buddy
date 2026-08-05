import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchBooks, toCoverUrl, formatAuthor } from "./tools";
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

  it("returns book docs from the Open Library API", async () => {
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
});
