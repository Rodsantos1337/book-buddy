import express from "express";
import { handleChat } from "./chat";
import { handleModels } from "./models";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

app.use(express.json());

app.post("/api/chat", handleChat);
app.get("/api/models", handleModels);

app.listen(PORT, () => {
  console.log(`BookBuddy server running on http://localhost:${PORT}`);
});
