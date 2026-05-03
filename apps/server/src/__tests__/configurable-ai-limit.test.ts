import { DEFAULT_FREE_DAILY_AI_LIMIT } from "@snap-cals/shared";
import request from "supertest";
import app from "../app";
import adminPrisma from "../lib/admin-prisma";
import * as geminiService from "../services/gemini.service";
import { clearSettingsCache } from "../services/settings.service";
import {
  cleanDb,
  createTestUser,
  prisma,
  signAdminToken,
  signToken,
} from "./helpers";

const API_KEY = process.env.API_KEY ?? "";
const adminToken = signAdminToken("admin-test-id");
const DEFAULT_LIMIT = String(DEFAULT_FREE_DAILY_AI_LIMIT);

function adminReq(method: "get" | "put", path: string) {
  return request(app)
    [method](`/api/admin${path}`)
    .set("x-api-key", API_KEY)
    .set("Authorization", `Bearer ${adminToken}`);
}

jest.spyOn(geminiService, "estimateNutrition");

beforeEach(async () => {
  await cleanDb();
  await adminPrisma.platformSetting.upsert({
    where: { key: "signupEnabled" },
    update: { value: "true" },
    create: { key: "signupEnabled", value: "true" },
  });
  await adminPrisma.platformSetting.upsert({
    where: { key: "freeDailyAiLimit" },
    update: { value: DEFAULT_LIMIT },
    create: { key: "freeDailyAiLimit", value: DEFAULT_LIMIT },
  });
  clearSettingsCache();
  (geminiService.estimateNutrition as jest.Mock).mockResolvedValue({
    name: "Test Food",
    calories: 100,
    protein: 10,
    carbs: 10,
    fat: 5,
    servingSize: "1 serving",
  });
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
  await adminPrisma.$disconnect();
});

// ─── Admin settings: freeDailyAiLimit ────────────────────────────────────────

describe("GET /api/admin/settings", () => {
  it("returns freeDailyAiLimit as a number", async () => {
    const res = await adminReq("get", "/settings");
    expect(res.status).toBe(200);
    expect(res.body.data.freeDailyAiLimit).toBe(DEFAULT_FREE_DAILY_AI_LIMIT);
    expect(typeof res.body.data.freeDailyAiLimit).toBe("number");
  });
});

describe("PUT /api/admin/settings — freeDailyAiLimit", () => {
  it("updates freeDailyAiLimit to 5", async () => {
    const res = await adminReq("put", "/settings").send({
      freeDailyAiLimit: 5,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.freeDailyAiLimit).toBe(5);
  });

  it("rejects value below 1", async () => {
    const res = await adminReq("put", "/settings").send({
      freeDailyAiLimit: 0,
    });
    expect(res.status).toBe(400);
  });

  it("rejects value above 20", async () => {
    const res = await adminReq("put", "/settings").send({
      freeDailyAiLimit: 21,
    });
    expect(res.status).toBe(400);
  });

  it("rejects non-integer value", async () => {
    const res = await adminReq("put", "/settings").send({
      freeDailyAiLimit: 3.5,
    });
    expect(res.status).toBe(400);
  });

  it("clears cache so new value takes effect", async () => {
    await adminReq("put", "/settings").send({ freeDailyAiLimit: 10 });

    const user = await createTestUser();
    const token = signToken(user.id);

    const res = await request(app)
      .get("/api/usage")
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data.limit).toBe(10);
  });
});

// ─── Server enforcement with dynamic limit ───────────────────────────────────

describe("AI usage enforcement with configurable limit", () => {
  it("GET /api/usage returns configured limit", async () => {
    await adminPrisma.platformSetting.update({
      where: { key: "freeDailyAiLimit" },
      data: { value: "7" },
    });
    clearSettingsCache();

    const user = await createTestUser();
    const token = signToken(user.id);

    const res = await request(app)
      .get("/api/usage")
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.limit).toBe(7);
  });

  it("enforces the configured limit on AI requests", async () => {
    await adminPrisma.platformSetting.update({
      where: { key: "freeDailyAiLimit" },
      data: { value: "1" },
    });
    clearSettingsCache();

    const user = await createTestUser();
    const token = signToken(user.id);

    // First request should succeed
    const res1 = await request(app)
      .post("/api/ai/estimate")
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "pizza" });
    expect(res1.status).toBe(200);

    // Second request should be blocked
    const res2 = await request(app)
      .post("/api/ai/estimate")
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "burger" });
    expect(res2.status).toBe(429);
    expect(res2.body.limit).toBe(1);
  });
});
