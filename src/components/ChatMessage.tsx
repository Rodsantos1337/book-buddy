import ReactMarkdown from "react-markdown";
import type { ChatMessage as ChatMessageType } from "../types";

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-1 last:mb-0">{children}</p>,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-fg">{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc space-y-0.5 pl-5">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal space-y-0.5 pl-5">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-bg-2 px-1 text-sm">{children}</code>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="underline text-green hover:text-green/80" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%]">
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            isUser ? "bg-green text-bg-0" : "bg-bg-1 text-fg ring-1 ring-bg-3"
          }`}
        >
          <ReactMarkdown components={markdownComponents}>{message.text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
