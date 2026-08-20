export interface BookSuggestion {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  summary: string;
  reasonForSuggestion: string;
  status: "active" | "interested" | "removed";
}

export interface Settings {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export interface ChatRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  suggestions: BookSuggestion[];
  settings: Settings;
}

export interface ChatResponse {
  text: string;
  suggestions: BookSuggestion[];
  removedIds: string[];
}

export interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  coverUrl?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}
