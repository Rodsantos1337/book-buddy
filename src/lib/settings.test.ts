import { describe, it, expect, vi, beforeEach } from "vitest";
import { STORAGE_KEY, DEFAULT_SETTINGS, loadSettings, saveSettings } from "./settings";
import type { Settings } from "../types";

function stubLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  });
}

beforeEach(() => {
  vi.unstubAllGlobals();
  stubLocalStorage();
});

describe("settings persistence", () => {
  it("returns defaults when nothing is stored", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips the model through localStorage", () => {
    const saved: Settings = {
      baseUrl: "https://openrouter.ai/api/v1",
      model: "meta-llama/llama-3.3-70b-instruct:free",
      apiKey: "sk-test",
    };

    saveSettings(saved);
    expect(loadSettings()).toEqual(saved);
  });

  it("preserves unknown saved fields and fills missing ones from defaults", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ model: "some/model" }));

    expect(loadSettings()).toEqual({
      baseUrl: DEFAULT_SETTINGS.baseUrl,
      model: "some/model",
      apiKey: "",
    });
  });

  it("falls back to defaults on corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not-json");

    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
