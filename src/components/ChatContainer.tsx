import { useEffect, useRef } from "react";
import type { ChatMessage as ChatMessageType } from "../types";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

const SUGGESTIONS = [
  "Space opera with political intrigue",
  "Cozy mystery set in a small town",
  "Hard sci-fi with realistic physics",
  "Philosophical fantasy like The Name of the Wind",
  "Historical fiction set in ancient Rome",
];

interface ChatContainerProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  error: string | null;
  onSend: (text: string) => void;
}

export default function ChatContainer({ messages, isLoading, error, onSend }: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasStarted = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, error]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        {!hasStarted && !isLoading && (
          <div className="mt-20 text-center text-grey-1">
            <p className="text-lg">What are you in the mood to read?</p>
            <p className="mt-1 text-sm">Try something like "mystery novels set in Paris" or "books like Dune"</p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
        </div>

        {isLoading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-grey-0">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green" />
            BookBuddy is searching...
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red/30 bg-red/10 px-4 py-3 text-sm text-red">{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {!hasStarted && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {SUGGESTIONS.map((text) => (
            <button
              key={text}
              onClick={() => onSend(text)}
              className="cursor-pointer rounded-full border border-bg-3 bg-bg-1 px-3 py-1.5 text-xs text-grey-0 hover:border-green/40 hover:text-fg"
            >
              {text}
            </button>
          ))}
        </div>
      )}

      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}
