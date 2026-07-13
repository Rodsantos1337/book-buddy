import { serve } from "@hono/node-server";
import app from "./app";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`BookBuddy server running on http://localhost:${info.port}`);
});
