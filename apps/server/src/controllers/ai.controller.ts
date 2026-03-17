import { Request, Response } from "express";
import { estimateNutrition } from "../services/gemini.service";
import { AiEstimateRequest, AI_DESCRIPTION_MAX_LENGTH } from "@snap-cals/shared";
import { validateImage } from "./validate-image";

export const estimate = async (req: Request<{}, {}, AiEstimateRequest>, res: Response) => {
  try {
    const { description, image } = req.body;

    const imageError = validateImage(image);
    if (imageError) return res.status(400).json({ message: imageError });

    const hasImage = !!image;
    const text = typeof description === "string" ? description.trim() : "";

    if (!text && !hasImage) {
      return res.status(400).json({ message: "description or image is required" });
    }
    if (text.length > AI_DESCRIPTION_MAX_LENGTH) {
      return res.status(400).json({ message: `Description must not exceed ${AI_DESCRIPTION_MAX_LENGTH} characters` });
    }

    const prompt = text || "Estimate the nutrition of this food";
    const data = await estimateNutrition(prompt, image);
    res.json({ data });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status === 429 ? 429 : 500;
    const message = status === 429 ? "AI is busy, try again in a moment" : "Failed to estimate nutrition";
    res.status(status).json({ message });
  }
};
