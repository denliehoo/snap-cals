import type { ChatMessage, GoalRecommendation } from "@snap-cals/shared";
import { toJSONSchema, z } from "zod";
import { createGeminiClient } from "./gemini.service";

const responseSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("question"), content: z.string() }),
  z.object({
    type: z.literal("recommendation"),
    content: z.string(),
    recommendation: z.object({
      dailyCalories: z.number(),
      dailyProtein: z.number(),
      dailyCarbs: z.number(),
      dailyFat: z.number(),
      explanation: z.string(),
    }),
  }),
]);

export type GoalCoachParsed = z.infer<typeof responseSchema>;

const SYSTEM_PROMPT = `You are a nutrition goal coach. Help users set daily calorie and macro targets through conversation.

GATHERING INFO (ask about ALL of these before making a recommendation):
1. Goal type: lose weight, gain muscle, maintain, or body recomposition
2. Sex: needed for BMR formula
3. Age: needed for BMR formula
4. Current weight (kg): needed for BMR + protein calculation
5. Height (cm): needed for BMR formula
6. Activity level: sedentary, lightly active, moderately active, very active, or extremely active
7. For weight loss: how much they want to lose (e.g. 5kg, 10kg) and how fast (steady/gradual vs aggressive)
8. For muscle gain: whether they want a lean bulk (minimal fat gain) or more aggressive bulk
9. Current body composition context if offered (e.g. "I'm skinny fat", "I already lift 4x/week")

Be smart about batched info — if the user provides multiple details in one message, acknowledge them and only ask for what's missing.
Ask up to 5 rounds of questions. Be concise and friendly.
When asking about activity level, give brief examples (e.g. "desk job with no exercise" vs "gym 4x/week").

CALCULATIONS (use when you have enough info):
BMR (Mifflin-St Jeor):
- Men: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
- Women: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161

TDEE = BMR × activity multiplier:
- Sedentary: 1.2, Lightly active: 1.375, Moderately active: 1.55, Very active: 1.725, Extremely active: 1.9

Calorie adjustments: Lose weight: -300 to -600 kcal. Maintain: at TDEE. Body recomp: -100 to -200 kcal. Lean bulk: +200 to +300. Muscle gain: +200 to +500.

Macros per kg bodyweight: Protein: 1.6-2.2 g/kg (all goals). Fat: 0.7-1.0 g/kg. Carbs: fill remaining calories (4 kcal/g).

SAFETY: Minimum 1200 kcal (women), 1500 kcal (men). Never recommend <800 kcal. Max weight loss ~1 kg/week. Include disclaimer that these are estimates and users should consult a healthcare professional.

Round all values to whole numbers.

Respond in JSON: { "type": "question", "content": "..." } or { "type": "recommendation", "content": "...", "recommendation": { "dailyCalories": N, "dailyProtein": N, "dailyCarbs": N, "dailyFat": N, "explanation": "..." } }`;

export async function goalCoach(
  messages: ChatMessage[],
  client = createGeminiClient(),
): Promise<{ message: string; recommendation?: GoalRecommendation }> {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: toJSONSchema(responseSchema),
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini API");

  const parsed = responseSchema.parse(JSON.parse(text));

  if (parsed.type === "recommendation") {
    return { message: parsed.content, recommendation: parsed.recommendation };
  }
  return { message: parsed.content };
}
