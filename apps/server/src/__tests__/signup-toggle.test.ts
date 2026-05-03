import request from "supertest";
import app from "../app";
import adminPrisma from "../lib/admin-prisma";
import { clearSettingsCache } from "../services/settings.service";
import { cleanDb, prisma, signAdminToken } from "./helpers";

const API_KEY = process.env.API_KEY ?? "";
const adminToken = signAdminToken("admin-test-id");

function adminReq(method: "get" | "put", path: string) {
  return request(app)
    [method](`/api/admin${path}`)
    .set("x-api-key", API_KEY)
    .set("Authorization", `Bearer ${adminToken}`);
}

beforeEach(async () => {
  await cleanDb();
  await adminPrisma.platformSetting.upsert({
    where: { key: "signupEnabled" },
    update: { value: "true" },
    create: { key: "signupEnabled", value: "true" },
  });
  clearSettingsCache();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
  await adminPrisma.$disconnect();
});

// ─── Public signup-status endpoint ───────────────────────────────────────────

describe("GET /api/settings/signup-status", () => {
  it("returns signupEnabled true by default", async () => {
    const res = await request(app).get("/api/settings/signup-status");
    expect(res.status).toBe(200);
    expect(res.body.data.signupEnabled).toBe(true);
  });

  it("returns signupEnabled false when disabled", async () => {
    await adminPrisma.platformSetting.update({
      where: { key: "signupEnabled" },
      data: { value: "false" },
    });
    clearSettingsCache();

    const res = await request(app).get("/api/settings/signup-status");
    expect(res.status).toBe(200);
    expect(res.body.data.signupEnabled).toBe(false);
  });

  it("does not require API key", async () => {
    const res = await request(app).get("/api/settings/signup-status");
    expect(res.status).toBe(200);
  });
});

// ─── Admin settings endpoints ────────────────────────────────────────────────

describe("GET /api/admin/settings", () => {
  it("returns platform settings", async () => {
    const res = await adminReq("get", "/settings");
    expect(res.status).toBe(200);
    expect(res.body.data.signupEnabled).toBe(true);
  });

  it("requires admin auth", async () => {
    const res = await request(app)
      .get("/api/admin/settings")
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/admin/settings", () => {
  it("updates signupEnabled to false", async () => {
    const res = await adminReq("put", "/settings").send({
      signupEnabled: false,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.signupEnabled).toBe(false);
  });

  it("updates signupEnabled to true", async () => {
    await adminPrisma.platformSetting.update({
      where: { key: "signupEnabled" },
      data: { value: "false" },
    });
    clearSettingsCache();

    const res = await adminReq("put", "/settings").send({
      signupEnabled: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.signupEnabled).toBe(true);
  });
});

// ─── Signup enforcement ──────────────────────────────────────────────────────

jest.mock("../services/email.service", () => ({
  sendVerificationCode: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetCode: jest.fn().mockResolvedValue(undefined),
}));

describe("Signup enforcement when disabled", () => {
  beforeEach(async () => {
    await adminPrisma.platformSetting.update({
      where: { key: "signupEnabled" },
      data: { value: "false" },
    });
    clearSettingsCache();
  });

  it("POST /api/auth/signup returns 403", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .set("x-api-key", API_KEY)
      .send({ email: "new@test.com", password: "password123" });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      "We're not accepting new sign-ups at the moment. Please check back later.",
    );
  });

  it("POST /api/auth/signup succeeds when enabled", async () => {
    await adminPrisma.platformSetting.update({
      where: { key: "signupEnabled" },
      data: { value: "true" },
    });
    clearSettingsCache();

    const res = await request(app)
      .post("/api/auth/signup")
      .set("x-api-key", API_KEY)
      .send({ email: "new@test.com", password: "password123" });
    expect(res.status).toBe(201);
  });
});
