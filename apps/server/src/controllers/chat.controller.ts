import { Request, Response } from "express";
import { chat } from "../services/chat.service";
import { AiChatRequest } from "@snap-cals/shared";

export const handleChat = async (req: Request<{}, {}, AiChatRequest>, res: Response) => {
  try {
    const { messages, forceEstimate } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "messages array is required and must not be empty" });
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content || !["user", "assistant"].includes(msg.role)) {
        return res.status(400).json({ message: "Each message must have a valid role and content" });
      }
    }

    const data = await chat(messages, !!forceEstimate);
    res.json({ data });
  } catch (e: any) {
    const status = e.status === 429 ? 429 : 500;
    const message = status === 429 ? "AI is busy, try again in a moment" : "Failed to process chat";
    res.status(status).json({ message });
  }
};
