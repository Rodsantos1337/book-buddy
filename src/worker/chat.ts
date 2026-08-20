import type { Context } from "hono";
import type {
  ChatRequest,
  ChatResponse,
  BookSuggestion,
  ChatCompletionMessage,
  ToolDefinition,
  ToolCall,
} from "./types";
import { searchBooks, toCoverUrl, formatAuthor } from "./tools";

const MAX_TOOL_ITERATIONS = 5;

const SYSTEM_PROMPT = `You are BookBuddy, an expert book recommendation assistant. Your goal is to help the user find the perfect book through conversational discovery and managing their recommendation board.

SEARCH GUIDELINES & QUERY FORMULATION:
1. Book search is a standard keyword index. It does NOT understand negations (e.g., "no romance") or natural language prompts (e.g., "books like Harry Potter").
2. To handle negative constraints or style requests, search positively for the core genre, theme, or overarching category. Filter the results in your context window before presenting them, selecting only the ones that match the user's constraints.
3. If the user names a seed book, perform a multi-step search:
   - First, search for the seed book to discover its subjects, authors, or styles.
   - Second, use those discovered attributes to perform a clean, targeted search for new candidates.

CONVERSATIONAL CHAT LAYOUT:
For your user-facing text responses, follow this structure:
1. ACKNOWLEDGE & VALIDATE: Begin by validating the user's specific request or mood, explaining why it's a compelling reading target and what you are looking for.
2. COMPARE & CONTRAST: Write a distinct 2-3 sentence paragraph for each recommended book. Explain exactly why it fits their taste, how it respects their preferences, and how it compares to other books mentioned.
3. ENGAGE: End with a single, natural question. If books were just added, ask which ones catch their eye. If books were removed, ask what didn't work. If preferences are vague, ask a targeted question about preferred pacing, prose style, or world-building.

BOARD MANAGEMENT & RULES:
- Use searchBooks to find real books; never invent titles.
- You must always call addToBoard to deliver book recommendations — do not just list them in text.
- TRIGGERING RECOMMENDATIONS: Only recommend books once the user has provided enough criteria to do so. On that first recommendation turn, add exactly 5 books to the board. If the user's initial message is just a greeting or is too vague, ask clarifying questions first.
- If the user asks for more suggestions later, add 1-5 more books to the board.
- For the "addToBoard" tool parameter, provide a concise 1-2 sentence summary of the book (keep the longer 2-3 sentence analysis for the chat response).
- If the user's feedback rules out a book, call removeFromBoard. Briefly explain your reasoning in the chat before executing the tool.
- Never re-suggest books that are currently active, interested, or have been removed during this session.`;

function buildTool(
  name: string,
  description: string,
  properties: Record<string, unknown>,
  required: string[],
): ToolDefinition {
  return {
    type: "function",
    function: {
      name,
      description,
      parameters: {
        type: "object",
        properties,
        required,
        additionalProperties: false,
      },
    },
  };
}

function buildSearchTool(): ToolDefinition {
  return buildTool(
    "searchBooks",
    "Search for books by query (title, author, genre, or subject)",
    {
      query: {
        type: "string",
        description: "Search query (e.g. '[genre] with [theme/setting]' or 'books by [author]')",
      },
      limit: {
        type: "number",
        description: "Number of results to return (default 5, max 10)",
      },
    },
    ["query"],
  );
}

function buildAddToBoardTool(): ToolDefinition {
  return buildTool(
    "addToBoard",
    "Add book recommendations to the user's board. On your first response, add 5 books. On subsequent turns, add 1-5.",
    {
      books: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Book id (e.g. /works/OL123W or google-abc123)" },
            title: { type: "string" },
            author: { type: "string" },
            coverUrl: { type: "string", description: "Cover image URL or empty string" },
            summary: { type: "string", description: "1-2 sentence compelling summary" },
            reasonForSuggestion: { type: "string", description: "Why this book fits the user" },
          },
          required: ["id", "title", "author", "coverUrl", "summary", "reasonForSuggestion"],
          additionalProperties: false,
        },
      },
    },
    ["books"],
  );
}

function buildRemoveFromBoardTool(): ToolDefinition {
  return buildTool(
    "removeFromBoard",
    "Remove one or more books from the board when the user's feedback clearly rules them out.",
    {
      bookIds: {
        type: "array",
        items: { type: "string" },
        description: "Book ids of the books to remove",
      },
    },
    ["bookIds"],
  );
}

function buildMessages(req: ChatRequest): ChatCompletionMessage[] {
  const active = req.suggestions.filter((s) => s.status === "active");
  const interested = req.suggestions.filter((s) => s.status === "interested");
  const removed = req.suggestions.filter((s) => s.status === "removed");

  let boardNote = "\n\nCurrent board:";
  if (active.length === 0 && interested.length === 0 && removed.length === 0) {
    boardNote += " (empty)";
  } else {
    if (active.length > 0) {
      boardNote += `\n  Books on the board: ${active.map((s) => `"${s.title}"`).join(", ")}.`;
    }
    if (interested.length > 0) {
      boardNote += `\n  Books the user is interested in (find more like these): ${interested.map((s) => `"${s.title}"`).join(", ")}.`;
    }
    if (removed.length > 0) {
      boardNote += `\n  Books removed (DO NOT suggest again): ${removed.map((s) => `"${s.title}"`).join(", ")}.`;
    }
  }

  const result: ChatCompletionMessage[] = [
    { role: "system", content: SYSTEM_PROMPT + boardNote },
    ...req.messages.map((m) => ({ role: m.role, content: m.content })),
  ];
  return result;
}

function extractFinishedTitles(messages: { role: string; content: string }[]): string[] {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return [];

  const text = lastUser.content;
  const pattern =
    /(?:finished|just\s+finished|just\s+read|done\s+(?:with|reading))\s+(.+?)(?:[,;—–-]|and\s+(?:didn't|wasn't|not)|but|\.\s|$)/i;
  const match = text.match(pattern);
  if (!match) return [];

  const raw = match[1].replace(/^["'‘“]|["'’”]$/g, "").trim();
  return raw ? [raw] : [];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
}

function isFinishedBook(title: string, finishedTitles: string[]): boolean {
  const norm = normalize(title);
  return finishedTitles.some((f) => norm.includes(normalize(f)) || normalize(f).includes(norm));
}

async function callOpenAI(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatCompletionMessage[],
  tools: ToolDefinition[],
  toolChoice?: { type: "function"; function: { name: string } },
): Promise<{ choice: { finish_reason: string; message: ChatCompletionMessage } | null; cost?: string }> {
  const body: Record<string, unknown> = {
    model,
    messages,
    tools,
  };
  if (toolChoice) {
    body.tool_choice = toolChoice;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "AI request failed", { cause: err });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody.error?.message || errBody.error || `API error (${res.status})`;
    throw new Error(msg);
  }

  const data = await res.json();
  const choice = data.choices?.[0] ?? null;
  return { choice };
}

export async function handleChat(c: Context): Promise<Response> {
  const body = await c.req.json<ChatRequest>();
  const env = c.env as Record<string, string | undefined>;

  if (!body.settings?.apiKey) {
    return c.json({ error: "Missing API key — check Settings" }, 400);
  }
  if (!body.settings?.model) {
    return c.json({ error: "No model selected — check Settings" }, 400);
  }

  try {
    const messages: ChatCompletionMessage[] = buildMessages(body);
    const tools = [buildSearchTool(), buildAddToBoardTool(), buildRemoveFromBoardTool()];

    let finalText = "";
    let finalSuggestions: BookSuggestion[] = [];
    let finalRemovedIds: string[] = [];
    const coverMap = new Map<string, string>();

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const isLastIteration = i === MAX_TOOL_ITERATIONS - 1;

      const result = await callOpenAI(
        body.settings.baseUrl,
        body.settings.apiKey,
        body.settings.model,
        messages,
        tools,
        isLastIteration ? { type: "function" as const, function: { name: "addToBoard" } } : undefined,
      );

      if (!result.choice) {
        throw new Error("AI returned an empty response — try again");
      }

      const choice = result.choice;
      const finishReason = choice.finish_reason ?? "stop";
      const message = choice.message;

      if (message?.content) {
        finalText = message.content;
      }

      if (finishReason === "stop") {
        break;
      }

      const toolCall = message?.tool_calls?.[0] as ToolCall | undefined;
      if (!toolCall) break;

      if (toolCall.function.name === "addToBoard") {
        const args = JSON.parse(toolCall.function.arguments);
        finalSuggestions = (args.books || []).map((b: Record<string, unknown>) => ({
          id: String(b.id),
          title: String(b.title),
          author: String(b.author),
          coverUrl: coverMap.get(String(b.id)) || String(b.coverUrl || ""),
          summary: String(b.summary || ""),
          reasonForSuggestion: String(b.reasonForSuggestion || ""),
          status: "active" as const,
        }));
        break;
      }

      if (toolCall.function.name === "removeFromBoard") {
        const args = JSON.parse(toolCall.function.arguments);
        finalRemovedIds = (args.bookIds || []).map(String);
        messages.push({
          role: "assistant",
          content: null,
          tool_calls: [toolCall],
        });
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: true, removed: finalRemovedIds }),
        });
        continue;
      }

      if (toolCall.function.name === "searchBooks") {
        const args = JSON.parse(toolCall.function.arguments);
        const docs = await searchBooks(args.query, args.limit || 5, env.GOOGLE_BOOKS_API_KEY);

        const results = docs.map((d) => {
          const cover = d.coverUrl || toCoverUrl(d.cover_i);
          coverMap.set(d.key, cover);
          return {
            key: d.key,
            title: d.title,
            author: formatAuthor(d.author_name),
            year: d.first_publish_year,
            coverUrl: cover,
            subjects: (d.subject || []).slice(0, 3),
          };
        });

        messages.push({
          role: "assistant",
          content: null,
          tool_calls: [toolCall],
        });

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(results),
        });
      }
    }

    if (finalSuggestions.length === 0) {
      const safetyMessages: ChatCompletionMessage[] = [
        ...messages,
        {
          role: "user",
          content:
            "Based on the search results above, recommend 3-5 excellent books by calling addToBoard. Do not suggest books the user has already read or finished.",
        },
      ];

      const result = await callOpenAI(
        body.settings.baseUrl,
        body.settings.apiKey,
        body.settings.model,
        safetyMessages,
        [buildAddToBoardTool()],
        { type: "function", function: { name: "addToBoard" } },
      );

      const safeToolCall = result.choice?.message?.tool_calls?.[0] as ToolCall | undefined;
      if (safeToolCall?.function.name === "addToBoard") {
        const args = JSON.parse(safeToolCall.function.arguments);
        finalSuggestions = (args.books || []).map((b: Record<string, unknown>) => ({
          id: String(b.id),
          title: String(b.title),
          author: String(b.author),
          coverUrl: coverMap.get(String(b.id)) || String(b.coverUrl || ""),
          summary: String(b.summary || ""),
          reasonForSuggestion: String(b.reasonForSuggestion || ""),
          status: "active" as const,
        }));
        if (!finalText && result.choice?.message?.content) {
          finalText = result.choice.message.content;
        }
      }
    }

    const finishedTitles = extractFinishedTitles(body.messages);
    if (finishedTitles.length > 0) {
      const removed: BookSuggestion[] = [];
      finalSuggestions = finalSuggestions.filter((s) => {
        if (isFinishedBook(s.title, finishedTitles)) {
          removed.push(s);
          return false;
        }
        return true;
      });
      for (const r of removed) {
        if (!finalRemovedIds.includes(r.id)) {
          finalRemovedIds.push(r.id);
        }
      }
    }

    if (!finalText) {
      if (finalSuggestions.length > 0) {
        const titles = finalSuggestions.map((s) => `"${s.title}"`).join(", ");
        finalText = `I added ${finalSuggestions.length} books to your board: ${titles}. Each has a short summary — let me know which ones catch your eye, or if you'd like something different!`;
      } else {
        finalText = "I'm thinking about what to recommend — give me a moment!";
      }
    }

    return c.json({
      text: finalText,
      suggestions: finalSuggestions,
      removedIds: finalRemovedIds,
    } as ChatResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    if (message.includes("429") || message.includes("rate")) {
      return c.json({ error: "Rate limited — please wait a moment" }, 429);
    } else if (message.includes("401") || message.includes("auth") || message.includes("key")) {
      return c.json({ error: "Invalid API key — update in Settings" }, 401);
    } else {
      return c.json({ error: message }, 502);
    }
  }
}
