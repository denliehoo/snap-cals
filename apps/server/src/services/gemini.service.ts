import { GoogleGenAI } from "@google/genai";
import { z, toJSONSchema } from "zod";

const nutritionSchema = z.object({
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  servingSize: z.string(),
});

export type NutritionEstimate = z.infer<typeof nutritionSchema>;

const SYSTEM_PROMPT =
  "You are a nutrition estimator. Given a food description, estimate its nutrition for a single item. " +
  "If no quantity is specified, assume a standard serving. " +
  "Return calories (kcal), protein (g), carbs (g), fat (g), a cleaned-up food name, and serving size.";

export function createGeminiClient(apiKey = process.env.GEMINI_API_KEY!) {
  return new GoogleGenAI({ apiKey });
}

export async function estimateNutrition(
  description: string,
  client = createGeminiClient(),
): Promise<NutritionEstimate> {
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: description,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: toJSONSchema(nutritionSchema),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from Gemini API");
  }

  return nutritionSchema.parse(JSON.parse(text));
}
