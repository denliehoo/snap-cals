import request from "supertest";
import app from "../app";
import * as geminiService from "../services/gemini.service";
import { cleanDb, createTestUser, prisma, signToken } from "./helpers";

jest.spyOn(geminiService, "estimateNutrition");

const MOCK_RESULT = {
  name: "Big Mac",
  calories: 550,
  protein: 25,
  carbs: 45,
  fat: 30,
  servingSize: "1 burger (200g)",
};

let token: string;

beforeEach(async () => {
  await cleanDb();
  const user = await createTestUser();
  token = signToken(user.id);
  (geminiService.estimateNutrition as jest.Mock).mockResolvedValue(MOCK_RESULT);
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("POST /api/ai/estimate", () => {
  it("returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/ai/estimate")
      .set("x-api-key", process.env.API_KEY!)
      .send({ description: "big mac" });

    expect(res.status).toBe(401);
  });

  it("returns 400 with empty description", async () => {
    const res = await request(app)
      .post("/api/ai/estimate")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/description/i);
  });

  it("returns 400 with missing description", async () => {
    const res = await request(app)
      .post("/api/ai/estimate")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 200 with valid description", async () => {
    const res = await request(app)
      .post("/api/ai/estimate")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "big mac" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(MOCK_RESULT);
    expect(geminiService.estimateNutrition).toHaveBeenCalledWith(
      "big mac",
      undefined,
    );
  });

  it("returns 429 on rate limit", async () => {
    const err = Object.assign(new Error("rate limited"), { status: 429 });
    (geminiService.estimateNutrition as jest.Mock).mockRejectedValue(err);

    const res = await request(app)
      .post("/api/ai/estimate")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "pizza" });

    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/busy/i);
  });

  it("returns 500 on generic error", async () => {
    (geminiService.estimateNutrition as jest.Mock).mockRejectedValue(
      new Error("fail"),
    );

    const res = await request(app)
      .post("/api/ai/estimate")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "pizza" });

    expect(res.status).toBe(500);
  });

  // --- Image support ---

  it("returns 200 with valid image and description", async () => {
    const image = { base64: "abc123", mimeType: "image/jpeg" };
    const res = await request(app)
      .post("/api/ai/estimate")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "chicken rice", image });

    expect(res.status).toBe(200);
    expect(geminiService.estimateNutrition).toHaveBeenCalledWith(
      "chicken rice",
      image,
    );
  });

  it("returns 200 with image only (no description)", async () => {
    const image = { base64: "abc123", mimeType: "image/png" };
    const res = await request(app)
      .post("/api/ai/estimate")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "", image });

    expect(res.status).toBe(200);
    expect(geminiService.estimateNutrition).toHaveBeenCalledWith(
      "Estimate the nutrition of this food",
      image,
    );
  });

  it("returns 400 with invalid mimeType", async () => {
    const res = await request(app)
      .post("/api/ai/estimate")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "food",
        image: { base64: "abc", mimeType: "image/gif" },
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/mimeType/i);
  });

  it("returns 400 with oversized image", async () => {
    const res = await request(app)
      .post("/api/ai/estimate")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "food",
        image: {
          base64: "a".repeat(5 * 1024 * 1024 + 1),
          mimeType: "image/jpeg",
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/too large/i);
  });

  it("returns 400 when image missing base64", async () => {
    const res = await request(app)
      .post("/api/ai/estimate")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "food", image: { mimeType: "image/jpeg" } });

    expect(res.status).toBe(400);
  });
});
