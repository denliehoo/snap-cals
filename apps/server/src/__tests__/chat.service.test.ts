import { chat } from "../services/chat.service";

const QUESTION_RESPONSE = { type: "question", content: "What size was it?" };
const ESTIMATE_RESPONSE = {
  type: "estimate",
  content: "Here's your estimate",
  estimate: {
    name: "Big Mac",
    calories: 550,
    protein: 25,
    carbs: 45,
    fat: 30,
    servingSize: "1 burger",
  },
};

function mockClient(text: string | undefined) {
  return {
    models: {
      generateContent: jest.fn().mockResolvedValue({ text }),
    },
  } as any;
}

describe("chat.service", () => {
  it("returns a question response", async () => {
    const client = mockClient(JSON.stringify(QUESTION_RESPONSE));
    const result = await chat(
      [{ role: "user", content: "big mac" }],
      false,
      undefined,
      client,
    );

    expect(result).toEqual({ message: "What size was it?" });
  });

  it("returns an estimate response", async () => {
    const client = mockClient(JSON.stringify(ESTIMATE_RESPONSE));
    const result = await chat(
      [{ role: "user", content: "big mac" }],
      false,
      undefined,
      client,
    );

    expect(result).toEqual({
      message: "Here's your estimate",
      estimate: ESTIMATE_RESPONSE.estimate,
    });
  });

  it("maps assistant role to model for Gemini", async () => {
    const client = mockClient(JSON.stringify(QUESTION_RESPONSE));
    await chat(
      [
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello" },
      ],
      false,
      undefined,
      client,
    );

    const contents = client.models.generateContent.mock.calls[0][0].contents;
    expect(contents[0].role).toBe("user");
    expect(contents[1].role).toBe("model");
  });

  it("appends force estimate message when forceEstimate is true", async () => {
    const client = mockClient(JSON.stringify(ESTIMATE_RESPONSE));
    await chat([{ role: "user", content: "big mac" }], true, undefined, client);

    const contents = client.models.generateContent.mock.calls[0][0].contents;
    expect(contents).toHaveLength(2);
    expect(contents[1].role).toBe("user");
    expect(contents[1].parts[0].text).toMatch(/best estimate/i);
  });

  it("throws on empty response", async () => {
    const client = mockClient(undefined);
    await expect(
      chat([{ role: "user", content: "pizza" }], false, undefined, client),
    ).rejects.toThrow("Empty response");
  });

  it("throws on invalid JSON shape", async () => {
    const client = mockClient(JSON.stringify({ foo: "bar" }));
    await expect(
      chat([{ role: "user", content: "pizza" }], false, undefined, client),
    ).rejects.toThrow();
  });

  it("includes inlineData in first user message when image provided", async () => {
    const client = mockClient(JSON.stringify(QUESTION_RESPONSE));
    const image = { base64: "img123", mimeType: "image/png" };

    await chat(
      [{ role: "user", content: "what is this" }],
      false,
      image,
      client,
    );

    const contents = client.models.generateContent.mock.calls[0][0].contents;
    expect(contents[0].parts).toEqual([
      { inlineData: { mimeType: "image/png", data: "img123" } },
      { text: "what is this" },
    ]);
  });

  it("does not include inlineData in subsequent messages", async () => {
    const client = mockClient(JSON.stringify(QUESTION_RESPONSE));
    const image = { base64: "img123", mimeType: "image/png" };

    await chat(
      [
        { role: "user", content: "what is this" },
        { role: "assistant", content: "What size?" },
        { role: "user", content: "medium" },
      ],
      false,
      image,
      client,
    );

    const contents = client.models.generateContent.mock.calls[0][0].contents;
    // First message has image
    expect(contents[0].parts).toHaveLength(2);
    // Third message (second user message) has text only
    expect(contents[2].parts).toEqual([{ text: "medium" }]);
  });
});
