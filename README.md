# BookBuddy

Book Buddy is a simple app for finding out what book to read next.
LLMs are surprisingly good at recommending books on their own; this app
allows the LLM to actually search using the Open Library API to look for
real book suggestions.

## Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite
- **Backend:** Express 5, TypeScript 
- **AI:** OpenAI SDK → OpenRouter (bring your own API key)
- **Search:** Open Library API

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env` (or leave defaults — server uses port 4000)
3. `pnpm install`
4. `pnpm run dev` — starts frontend on `http://localhost:5173` and backend on `http://localhost:4000`

## Production

```bash
pnpm run build    # builds frontend (Vite) + compiles backend (tsc)
pnpm run start    # runs the backend on :4000
```

Serve the `dist/` folder with any static file server for the frontend.

## Getting an API Key

1. Sign up at [OpenRouter](https://openrouter.ai)
2. Create a key and paste it in Settings (gear icon, top-right)
3. Click "Fetch" to load available models, pick one, and save

## Architecture

Two-panel layout:
- **Left panel:** Chat interface — describe what you want to read
- **Right panel:** Book board — recommendations from the AI
- **Drawer:** Click a book for details and actions
- **Settings modal:** API key, model, base URL configuration

The backend proxies requests to OpenRouter and uses Open Library's search API via AI tool calls.