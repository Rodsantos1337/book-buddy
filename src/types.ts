export interface BookSuggestion {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  summary: string;
  reasonForSuggestion: string;
  status: "active" | "interested" | "removed";
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
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

export interface ModelInfo {
  id: string;
  name: string;
}
