import request from "supertest";
import app from "../app";
import { cleanDb, createTestUser, prisma, signToken } from "./helpers";

const API_KEY = process.env.API_KEY ?? "";

let token: string;

beforeEach(async () => {
  await cleanDb();
  const user = await createTestUser();
  token = signToken(user.id);
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("GET /api/goals", () => {
  it("returns defaults when no goals set", async () => {
    const res = await request(app)
      .get("/api/goals")
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.dailyCalories).toBe(2000);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/goals").set("x-api-key", API_KEY);
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/goals", () => {
  const goalData = {
    dailyCalories: 1800,
    dailyProtein: 140,
    dailyCarbs: 200,
    dailyFat: 60,
  };

  it("creates goals", async () => {
    const res = await request(app)
      .put("/api/goals")
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${token}`)
      .send(goalData);

    expect(res.status).toBe(200);
    expect(res.body.data.dailyCalories).toBe(1800);
  });

  it("updates existing goals", async () => {
    await request(app)
      .put("/api/goals")
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${token}`)
      .send(goalData);

    const res = await request(app)
      .put("/api/goals")
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...goalData, dailyCalories: 2200 });

    expect(res.status).toBe(200);
    expect(res.body.data.dailyCalories).toBe(2200);
  });

  it("returns 400 for missing values", async () => {
    const res = await request(app)
      .put("/api/goals")
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${token}`)
      .send({ dailyCalories: 1800 });

    expect(res.status).toBe(400);
  });

  it("returns 400 for negative values", async () => {
    const res = await request(app)
      .put("/api/goals")
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...goalData, dailyCalories: -100 });

    expect(res.status).toBe(400);
  });

  it("goals are scoped per user", async () => {
    await request(app)
      .put("/api/goals")
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${token}`)
      .send(goalData);

    const other = await createTestUser("other@test.com");
    const otherToken = signToken(other.id);

    const res = await request(app)
      .get("/api/goals")
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${otherToken}`);

    // Other user should get defaults, not the first user's goals
    expect(res.body.data.dailyCalories).toBe(2000);
  });
});
