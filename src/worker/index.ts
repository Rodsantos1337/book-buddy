import { Hono } from "hono";
import { handleChat } from "./chat";
import { handleModels } from "./models";

const app = new Hono();

app.post("/api/chat", handleChat);
app.get("/api/models", handleModels);

export default app;
