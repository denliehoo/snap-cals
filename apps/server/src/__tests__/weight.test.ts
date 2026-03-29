import request from "supertest";
import app from "../app";
import {
  cleanDb,
  createTestUser,
  prisma,
  signToken,
  withApiKey,
} from "./helpers";

let token: string;
let userId: string;

beforeEach(async () => {
  await cleanDb();
  const user = await createTestUser();
  userId = user.id;
  token = signToken(user.id);
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

const auth = (req: ReturnType<typeof withApiKey>) =>
  req.set("Authorization", `Bearer ${token}`);

describe("POST /api/weight", () => {
  it("creates entry with both kg and lbs", async () => {
    const res = await auth(withApiKey(request(app).post("/api/weight"))).send({
      weight: 70,
      unit: "kg",
      loggedAt: new Date().toISOString(),
    });

    expect(res.status).toBe(201);
    expect(res.body.data.weightKg).toBe(70);
    expect(res.body.data.weightLbs).toBeCloseTo(154.32, 1);
  });

  it("converts lbs to kg", async () => {
    const res = await auth(withApiKey(request(app).post("/api/weight"))).send({
      weight: 154.32,
      unit: "lbs",
      loggedAt: new Date().toISOString(),
    });

    expect(res.status).toBe(201);
    expect(res.body.data.weightLbs).toBe(154.32);
    expect(res.body.data.weightKg).toBeCloseTo(70, 0);
  });

  it("stores optional note", async () => {
    const res = await auth(withApiKey(request(app).post("/api/weight"))).send({
      weight: 70,
      unit: "kg",
      loggedAt: new Date().toISOString(),
      note: "morning weigh-in",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.note).toBe("morning weigh-in");
  });

  it("returns 400 for missing weight", async () => {
    const res = await auth(withApiKey(request(app).post("/api/weight"))).send({
      unit: "kg",
      loggedAt: new Date().toISOString(),
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 for negative weight", async () => {
    const res = await auth(withApiKey(request(app).post("/api/weight"))).send({
      weight: -5,
      unit: "kg",
      loggedAt: new Date().toISOString(),
    });

    expect(res.status).toBe(400);
  });

  it("returns 401 without auth", async () => {
    const res = await withApiKey(request(app).post("/api/weight")).send({
      weight: 70,
      unit: "kg",
      loggedAt: new Date().toISOString(),
    });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/weight", () => {
  it("returns entries within date range", async () => {
    const now = new Date();
    await auth(withApiKey(request(app).post("/api/weight"))).send({
      weight: 70,
      unit: "kg",
      loggedAt: now.toISOString(),
    });

    const from = new Date(now.getTime() - 86400000).toISOString();
    const to = new Date(now.getTime() + 86400000).toISOString();

    const res = await auth(
      withApiKey(request(app).get(`/api/weight?from=${from}&to=${to}`)),
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("returns entries ordered by loggedAt desc", async () => {
    const earlier = new Date("2026-03-01T08:00:00Z");
    const later = new Date("2026-03-02T08:00:00Z");

    await auth(withApiKey(request(app).post("/api/weight"))).send({
      weight: 70,
      unit: "kg",
      loggedAt: earlier.toISOString(),
    });
    await auth(withApiKey(request(app).post("/api/weight"))).send({
      weight: 71,
      unit: "kg",
      loggedAt: later.toISOString(),
    });

    const res = await auth(
      withApiKey(
        request(app).get(
          `/api/weight?from=${new Date("2026-02-28").toISOString()}&to=${new Date("2026-03-03").toISOString()}`,
        ),
      ),
    );

    expect(res.body.data[0].weightKg).toBe(71);
    expect(res.body.data[1].weightKg).toBe(70);
  });

  it("returns 400 without from/to", async () => {
    const res = await auth(withApiKey(request(app).get("/api/weight")));
    expect(res.status).toBe(400);
  });

  it("scopes entries to authenticated user", async () => {
    await auth(withApiKey(request(app).post("/api/weight"))).send({
      weight: 70,
      unit: "kg",
      loggedAt: new Date().toISOString(),
    });

    const other = await createTestUser("other@test.com");
    const otherToken = signToken(other.id);

    const from = new Date(Date.now() - 86400000).toISOString();
    const to = new Date(Date.now() + 86400000).toISOString();

    const res = await withApiKey(
      request(app).get(`/api/weight?from=${from}&to=${to}`),
    ).set("Authorization", `Bearer ${otherToken}`);

    expect(res.body.data).toHaveLength(0);
  });
});

describe("PUT /api/weight/:id", () => {
  it("updates weight and recomputes counterpart", async () => {
    const create = await auth(
      withApiKey(request(app).post("/api/weight")),
    ).send({ weight: 70, unit: "kg", loggedAt: new Date().toISOString() });

    const id = create.body.data.id;
    const res = await auth(
      withApiKey(request(app).put(`/api/weight/${id}`)),
    ).send({ weight: 75, unit: "kg" });

    expect(res.status).toBe(200);
    expect(res.body.data.weightKg).toBe(75);
    expect(res.body.data.weightLbs).toBeCloseTo(165.35, 1);
  });

  it("updates note only", async () => {
    const create = await auth(
      withApiKey(request(app).post("/api/weight")),
    ).send({ weight: 70, unit: "kg", loggedAt: new Date().toISOString() });

    const id = create.body.data.id;
    const res = await auth(
      withApiKey(request(app).put(`/api/weight/${id}`)),
    ).send({ note: "after lunch" });

    expect(res.status).toBe(200);
    expect(res.body.data.note).toBe("after lunch");
    expect(res.body.data.weightKg).toBe(70);
  });

  it("returns 404 for other user's entry", async () => {
    const create = await auth(
      withApiKey(request(app).post("/api/weight")),
    ).send({ weight: 70, unit: "kg", loggedAt: new Date().toISOString() });

    const other = await createTestUser("other@test.com");
    const otherToken = signToken(other.id);

    const res = await withApiKey(
      request(app).put(`/api/weight/${create.body.data.id}`),
    )
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ weight: 99, unit: "kg" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/weight/:id", () => {
  it("deletes entry", async () => {
    const create = await auth(
      withApiKey(request(app).post("/api/weight")),
    ).send({ weight: 70, unit: "kg", loggedAt: new Date().toISOString() });

    const res = await auth(
      withApiKey(request(app).delete(`/api/weight/${create.body.data.id}`)),
    );

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Deleted");
  });

  it("returns 404 for other user's entry", async () => {
    const create = await auth(
      withApiKey(request(app).post("/api/weight")),
    ).send({ weight: 70, unit: "kg", loggedAt: new Date().toISOString() });

    const other = await createTestUser("other@test.com");
    const otherToken = signToken(other.id);

    const res = await withApiKey(
      request(app).delete(`/api/weight/${create.body.data.id}`),
    ).set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent entry", async () => {
    const res = await auth(
      withApiKey(request(app).delete("/api/weight/nonexistent")),
    );

    expect(res.status).toBe(404);
  });
});
