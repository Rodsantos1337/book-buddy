import { useState, type FormEvent } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t border-bg-3 bg-bg-1 p-4">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tell me what you're in the mood to read..."
        disabled={disabled}
        aria-label="Describe what you'd like to read"
        className="flex-1 rounded-lg border border-bg-3 bg-bg-0 px-4 py-2 text-sm text-fg placeholder-grey-0 focus:border-green focus:outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="cursor-pointer rounded-lg bg-green px-5 py-2 text-sm font-medium text-bg-0 hover:bg-green/80 disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}
