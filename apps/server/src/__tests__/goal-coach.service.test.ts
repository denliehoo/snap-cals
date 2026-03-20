import { goalCoach } from "../services/goal-coach.service";

const QUESTION_RESPONSE = { type: "question", content: "What's your goal?" };
const RECOMMENDATION_RESPONSE = {
  type: "recommendation",
  content: "Here are your targets",
  recommendation: {
    dailyCalories: 2200,
    dailyProtein: 160,
    dailyCarbs: 250,
    dailyFat: 70,
    explanation: "Based on your stats",
  },
};

function mockClient(text: string | undefined) {
  return {
    models: {
      generateContent: jest.fn().mockResolvedValue({ text }),
    },
  } as unknown as NonNullable<Parameters<typeof goalCoach>[1]>;
}

describe("goal-coach.service", () => {
  it("returns a question response", async () => {
    const client = mockClient(JSON.stringify(QUESTION_RESPONSE));
    const result = await goalCoach(
      [{ role: "user", content: "I want to lose weight" }],
      client,
    );

    expect(result).toEqual({ message: "What's your goal?" });
    expect(result.recommendation).toBeUndefined();
  });

  it("returns a recommendation response", async () => {
    const client = mockClient(JSON.stringify(RECOMMENDATION_RESPONSE));
    const result = await goalCoach(
      [{ role: "user", content: "male, 28, 80kg, 178cm, moderately active" }],
      client,
    );

    expect(result).toEqual({
      message: "Here are your targets",
      recommendation: RECOMMENDATION_RESPONSE.recommendation,
    });
  });

  it("maps assistant role to model for Gemini", async () => {
    const client = mockClient(JSON.stringify(QUESTION_RESPONSE));
    await goalCoach(
      [
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello" },
      ],
      client,
    );

    const call = (client.models.generateContent as jest.Mock).mock.calls[0][0];
    expect(call.contents[0].role).toBe("user");
    expect(call.contents[1].role).toBe("model");
  });

  it("sends multi-turn messages in correct order", async () => {
    const client = mockClient(JSON.stringify(QUESTION_RESPONSE));
    const messages = [
      { role: "user" as const, content: "I want to lose weight" },
      { role: "assistant" as const, content: "What's your sex and age?" },
      { role: "user" as const, content: "Male, 28" },
    ];
    await goalCoach(messages, client);

    const call = (client.models.generateContent as jest.Mock).mock.calls[0][0];
    expect(call.contents).toHaveLength(3);
    expect(call.contents[0].parts[0].text).toBe("I want to lose weight");
    expect(call.contents[1].parts[0].text).toBe("What's your sex and age?");
    expect(call.contents[2].parts[0].text).toBe("Male, 28");
  });

  it("throws on empty response", async () => {
    const client = mockClient(undefined);
    await expect(
      goalCoach([{ role: "user", content: "hi" }], client),
    ).rejects.toThrow("Empty response");
  });

  it("throws on invalid JSON shape", async () => {
    const client = mockClient(JSON.stringify({ foo: "bar" }));
    await expect(
      goalCoach([{ role: "user", content: "hi" }], client),
    ).rejects.toThrow();
  });
});
