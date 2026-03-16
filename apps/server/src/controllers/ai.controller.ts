import { Request, Response } from "express";
import { estimateNutrition } from "../services/gemini.service";
import { AiEstimateRequest } from "@snap-cals/shared";

export const estimate = async (req: Request<{}, {}, AiEstimateRequest>, res: Response) => {
  try {
    const { description } = req.body;
    if (!description || typeof description !== "string" || !description.trim()) {
      return res.status(400).json({ message: "description is required" });
    }

    const data = await estimateNutrition(description.trim());
    res.json({ data });
  } catch (e: any) {
    const status = e.status === 429 ? 429 : 500;
    const message = status === 429 ? "AI is busy, try again in a moment" : "Failed to estimate nutrition";
    res.status(status).json({ message });
  }
};
