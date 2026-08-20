import { useState, useRef, useCallback } from "react";
import type { ChatMessage, BookSuggestion, Settings } from "../types";
import { sendChat } from "../api/chat";
import { loadSettings, saveSettings } from "../lib/settings";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [boardBooks, setBoardBooks] = useState<BookSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const resetGenRef = useRef(0);

  const updateSettings = useCallback((s: Settings) => {
    setSettingsState(s);
    saveSettings(s);
  }, []);

  const resetChat = useCallback(() => {
    resetGenRef.current += 1;
    setMessages([]);
    setBoardBooks([]);
    setIsLoading(false);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { role: "user", text };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      const gen = resetGenRef.current;
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

        if (gen !== resetGenRef.current) return;

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
        if (gen !== resetGenRef.current) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        if (gen === resetGenRef.current) setIsLoading(false);
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
    resetChat,
    sendMessage,
    removeSuggestion,
    markInterested,
    clearError: () => setError(null),
  };
}
