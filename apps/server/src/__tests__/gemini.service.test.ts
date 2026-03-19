import { estimateNutrition } from "../services/gemini.service";

const VALID_RESPONSE = {
  name: "Grilled Chicken Breast",
  calories: 330,
  protein: 62,
  carbs: 0,
  fat: 7,
  servingSize: "200g",
};

function mockClient(text: string | undefined) {
  return {
    models: {
      generateContent: jest.fn().mockResolvedValue({ text }),
    },
  } as any;
}

describe("gemini.service", () => {
  it("sends the description and returns parsed nutrition data", async () => {
    const client = mockClient(JSON.stringify(VALID_RESPONSE));

    const result = await estimateNutrition(
      "grilled chicken breast 200g",
      undefined,
      client,
    );

    expect(client.models.generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: "grilled chicken breast 200g" }] },
        ],
        config: expect.objectContaining({
          responseMimeType: "application/json",
        }),
      }),
    );
    expect(result).toEqual(VALID_RESPONSE);
  });

  it("throws on empty response", async () => {
    const client = mockClient(undefined);
    await expect(estimateNutrition("pizza", undefined, client)).rejects.toThrow(
      "Empty response from Gemini API",
    );
  });

  it("throws on invalid JSON shape", async () => {
    const client = mockClient(JSON.stringify({ name: "Pizza" }));
    await expect(
      estimateNutrition("pizza", undefined, client),
    ).rejects.toThrow();
  });

  it("throws on non-JSON response", async () => {
    const client = mockClient("not json");
    await expect(
      estimateNutrition("pizza", undefined, client),
    ).rejects.toThrow();
  });

  it("includes inlineData when image is provided", async () => {
    const client = mockClient(JSON.stringify(VALID_RESPONSE));
    const image = { base64: "abc123", mimeType: "image/jpeg" };

    await estimateNutrition("chicken rice", image, client);

    const contents = client.models.generateContent.mock.calls[0][0].contents;
    expect(contents[0].parts).toEqual([
      { inlineData: { mimeType: "image/jpeg", data: "abc123" } },
      { text: "chicken rice" },
    ]);
  });

  it("sends text-only parts when no image", async () => {
    const client = mockClient(JSON.stringify(VALID_RESPONSE));

    await estimateNutrition("pizza", undefined, client);

    const contents = client.models.generateContent.mock.calls[0][0].contents;
    expect(contents[0].parts).toEqual([{ text: "pizza" }]);
  });
});
