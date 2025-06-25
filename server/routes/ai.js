import express from "express";
import cors from "cors";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import invoiceTools from "../tools/invoiceTools.js";

const router = express.Router();


const model1 = openai('gpt-4', {
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/chat", async (req, res) => {
  const { message: userMessage, accessToken, realmId } = req.body;

  const { textStream } = await streamText({
    model:model1,
    messages: [{ role: "user", content: userMessage }],
    tools: invoiceTools,
    toolContext: { accessToken, realmId },
  });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  console.log(textStream);
  for await (const part of textStream) {
    console.log(part);
    res.write(`data: ${JSON.stringify(part)}\n\n`);
  }
  res.end();
});

export default router;
