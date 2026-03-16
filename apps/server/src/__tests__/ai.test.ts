import request from "supertest";
import app from "../app";
import { createTestUser, signToken, cleanDb, prisma } from "./helpers";
import * as geminiService from "../services/gemini.service";

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
      .send({ description: "big mac" });

    expect(res.status).toBe(401);
  });

  it("returns 400 with empty description", async () => {
    const res = await request(app)
      .post("/api/ai/estimate")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/description/i);
  });

  it("returns 400 with missing description", async () => {
    const res = await request(app)
      .post("/api/ai/estimate")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 200 with valid description", async () => {
    const res = await request(app)
      .post("/api/ai/estimate")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "big mac" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(MOCK_RESULT);
    expect(geminiService.estimateNutrition).toHaveBeenCalledWith("big mac");
  });

  it("returns 429 on rate limit", async () => {
    const err: any = new Error("rate limited");
    err.status = 429;
    (geminiService.estimateNutrition as jest.Mock).mockRejectedValue(err);

    const res = await request(app)
      .post("/api/ai/estimate")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "pizza" });

    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/busy/i);
  });

  it("returns 500 on generic error", async () => {
    (geminiService.estimateNutrition as jest.Mock).mockRejectedValue(new Error("fail"));

    const res = await request(app)
      .post("/api/ai/estimate")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "pizza" });

    expect(res.status).toBe(500);
  });
});
