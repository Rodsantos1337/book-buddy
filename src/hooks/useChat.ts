import { useState, useCallback } from "react";
import type { ChatMessage, BookSuggestion, Settings } from "../types";
import { sendChat } from "../api/chat";

const STORAGE_KEY = "bookbuddy-settings";

const DEFAULT_SETTINGS: Settings = {
  baseUrl: "https://openrouter.ai/api/v1",
  model: "",
  apiKey: "",
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* JSON parse or localStorage access failed — use defaults */
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [boardBooks, setBoardBooks] = useState<BookSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettingsState] = useState<Settings>(loadSettings);

  const updateSettings = useCallback((s: Settings) => {
    setSettingsState(s);
    saveSettings(s);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { role: "user", text };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.text,
      }));

      try {
        const res = await sendChat({
          messages: chatHistory,
          suggestions: boardBooks,
          settings,
        });

        if (res.removedIds?.length > 0) {
          setBoardBooks((prev) =>
            prev.map((b) => (res.removedIds.includes(b.id) ? { ...b, status: "removed" as const } : b)),
          );
        }

        const newBooks: BookSuggestion[] = (res.suggestions || [])
          .filter((s) => !boardBooks.some((existing) => existing.id === s.id))
          .map((s) => ({ ...s, status: "active" as const }));

        if (newBooks.length > 0) {
          setBoardBooks((prev) => [...prev, ...newBooks]);
        }

        setMessages((prev) => [...prev, { role: "assistant", text: res.text }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, boardBooks, settings],
  );

  const removeSuggestion = useCallback((id: string) => {
    setBoardBooks((prev) => prev.map((s) => (s.id === id ? { ...s, status: "removed" as const } : s)));
  }, []);

  const markInterested = useCallback((id: string) => {
    setBoardBooks((prev) => prev.map((s) => (s.id === id ? { ...s, status: "interested" as const } : s)));
  }, []);

  return {
    messages,
    boardBooks,
    isLoading,
    error,
    settings,
    updateSettings,
    sendMessage,
    removeSuggestion,
    markInterested,
    clearError: () => setError(null),
  };
}
