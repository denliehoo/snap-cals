import {
  AI_CHAT_REPLY_MAX_LENGTH,
  type AiChatRequest,
} from "@snap-cals/shared";
import type { Request, Response } from "express";
import { chat } from "../services/chat.service";
import { validateImage } from "./validate-image";

export const handleChat = async (
  req: Request<{}, {}, AiChatRequest>,
  res: Response,
) => {
  try {
    const { messages, forceEstimate, image } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ message: "messages array is required and must not be empty" });
    }

    for (const msg of messages) {
      if (
        !msg.role ||
        !msg.content ||
        !["user", "assistant"].includes(msg.role)
      ) {
        return res
          .status(400)
          .json({ message: "Each message must have a valid role and content" });
      }
      if (
        msg.role === "user" &&
        msg.content.length > AI_CHAT_REPLY_MAX_LENGTH
      ) {
        return res.status(400).json({
          message: `Message content must not exceed ${AI_CHAT_REPLY_MAX_LENGTH} characters`,
        });
      }
    }

    const imageError = validateImage(image);
    if (imageError) return res.status(400).json({ message: imageError });

    const data = await chat(messages, !!forceEstimate, image);
    res.json({ data });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status === 429 ? 429 : 500;
    const message =
      status === 429
        ? "AI is busy, try again in a moment"
        : "Failed to process chat";
    res.status(status).json({ message });
  }
};
