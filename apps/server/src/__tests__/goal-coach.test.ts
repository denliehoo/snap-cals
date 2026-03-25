import request from "supertest";
import app from "../app";
import * as goalCoachService from "../services/goal-coach.service";
import { cleanDb, createTestUser, prisma, signToken } from "./helpers";

jest.spyOn(goalCoachService, "goalCoach");

const MOCK_QUESTION = { message: "What's your activity level?" };
const MOCK_RECOMMENDATION = {
  message: "Here are your targets",
  recommendation: {
    dailyCalories: 2200,
    dailyProtein: 160,
    dailyCarbs: 250,
    dailyFat: 70,
    explanation: "Based on your stats",
  },
};

let token: string;

beforeEach(async () => {
  await cleanDb();
  const user = await createTestUser();
  token = signToken(user.id);
  (goalCoachService.goalCoach as jest.Mock).mockResolvedValue(MOCK_QUESTION);
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("POST /api/ai/goal-coach", () => {
  it("returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/ai/goal-coach")
      .set("x-api-key", process.env.API_KEY!)
      .send({ messages: [{ role: "user", content: "hi" }] });

    expect(res.status).toBe(401);
  });

  it("returns 400 with empty messages", async () => {
    const res = await request(app)
      .post("/api/ai/goal-coach")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [] });

    expect(res.status).toBe(400);
  });

  it("returns 400 with missing messages", async () => {
    const res = await request(app)
      .post("/api/ai/goal-coach")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 400 with invalid message role", async () => {
    const res = await request(app)
      .post("/api/ai/goal-coach")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "system", content: "hi" }] });

    expect(res.status).toBe(400);
  });

  it("returns 400 when message content exceeds limit", async () => {
    const res = await request(app)
      .post("/api/ai/goal-coach")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "user", content: "a".repeat(301) }] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/exceed/i);
  });

  it("returns 200 with question response", async () => {
    const res = await request(app)
      .post("/api/ai/goal-coach")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "user", content: "I want to lose weight" }] });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(MOCK_QUESTION);
  });

  it("returns 200 with recommendation response", async () => {
    (goalCoachService.goalCoach as jest.Mock).mockResolvedValue(
      MOCK_RECOMMENDATION,
    );

    const res = await request(app)
      .post("/api/ai/goal-coach")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "user", content: "male 28 80kg 178cm" }] });

    expect(res.status).toBe(200);
    expect(res.body.data.recommendation).toBeDefined();
    expect(res.body.data.recommendation.dailyCalories).toBe(2200);
  });

  it("returns 429 on rate limit", async () => {
    const err = Object.assign(new Error("rate limited"), { status: 429 });
    (goalCoachService.goalCoach as jest.Mock).mockRejectedValue(err);

    const res = await request(app)
      .post("/api/ai/goal-coach")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "user", content: "hi" }] });

    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/busy/i);
  });

  it("returns 500 on generic error", async () => {
    (goalCoachService.goalCoach as jest.Mock).mockRejectedValue(
      new Error("fail"),
    );

    const res = await request(app)
      .post("/api/ai/goal-coach")
      .set("x-api-key", process.env.API_KEY!)
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "user", content: "hi" }] });

    expect(res.status).toBe(500);
  });
});
