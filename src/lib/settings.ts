import type { Settings } from "../types";

export const STORAGE_KEY = "bookbuddy-settings";

export const DEFAULT_SETTINGS: Settings = {
  baseUrl: "https://openrouter.ai/api/v1",
  model: "",
  apiKey: "",
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* JSON parse or localStorage access failed — use defaults */
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(s: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}
