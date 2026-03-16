import { z, toJSONSchema } from "zod";
import { createGeminiClient, NutritionEstimate } from "./gemini.service";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const chatResponseSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("question"), content: z.string() }),
  z.object({
    type: z.literal("estimate"),
    content: z.string(),
    estimate: z.object({
      name: z.string(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
      servingSize: z.string(),
    }),
  }),
]);

export type ChatResponse = z.infer<typeof chatResponseSchema>;

const SYSTEM_PROMPT =
  "You are a nutrition assistant. Ask up to 3 short clarifying questions to improve your estimate " +
  "(portion size, brand, preparation). When you have enough info or the user wants an estimate now, " +
  "respond with a nutrition estimate. Always respond in JSON with " +
  '{ "type": "question", "content": "..." } or ' +
  '{ "type": "estimate", "content": "...", "estimate": { name, calories, protein, carbs, fat, servingSize } }.';

export async function chat(
  messages: ChatMessage[],
  forceEstimate = false,
  client = createGeminiClient(),
): Promise<{ message: string; estimate?: NutritionEstimate }> {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  if (forceEstimate) {
    contents.push({
      role: "user",
      parts: [{ text: "Give me your best estimate now based on what you know." }],
    });
  }

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: toJSONSchema(chatResponseSchema),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from Gemini API");
  }

  const parsed = chatResponseSchema.parse(JSON.parse(text));

  if (parsed.type === "estimate") {
    return { message: parsed.content, estimate: parsed.estimate };
  }
  return { message: parsed.content };
}
