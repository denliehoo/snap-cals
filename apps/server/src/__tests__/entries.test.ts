import request from "supertest";
import app from "../app";
import { cleanDb, createTestUser, prisma, signToken } from "./helpers";

let token: string;
let userId: string;

beforeEach(async () => {
  await cleanDb();
  const user = await createTestUser();
  userId = user.id;
  token = signToken(userId);
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

const entryData = {
  name: "Chicken Breast",
  calories: 300,
  protein: 40,
  carbs: 0,
  fat: 8,
  servingSize: "200g",
  mealType: "LUNCH",
  date: "2026-03-15",
};

describe("POST /api/entries", () => {
  it("creates an entry", async () => {
    const res = await request(app)
      .post("/api/entries")
      .set("Authorization", `Bearer ${token}`)
      .send(entryData);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Chicken Breast");
  });

  it("returns 400 for missing required fields", async () => {
    const res = await request(app)
      .post("/api/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Oats" });

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid meal type", async () => {
    const res = await request(app)
      .post("/api/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...entryData, mealType: "BRUNCH" });

    expect(res.status).toBe(400);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).post("/api/entries").send(entryData);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/entries", () => {
  it("returns entries for a date", async () => {
    await request(app)
      .post("/api/entries")
      .set("Authorization", `Bearer ${token}`)
      .send(entryData);

    const res = await request(app)
      .get("/api/entries?date=2026-03-15")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("returns 400 without date param", async () => {
    const res = await request(app)
      .get("/api/entries")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it("does not return other users entries", async () => {
    // Create entry as current user
    await request(app)
      .post("/api/entries")
      .set("Authorization", `Bearer ${token}`)
      .send(entryData);

    // Query as different user
    const other = await createTestUser("other@test.com");
    const otherToken = signToken(other.id);

    const res = await request(app)
      .get("/api/entries?date=2026-03-15")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.body.data).toHaveLength(0);
  });
});

describe("GET /api/entries/week", () => {
  it("returns entries for a week", async () => {
    await request(app)
      .post("/api/entries")
      .set("Authorization", `Bearer ${token}`)
      .send(entryData);

    const res = await request(app)
      .get("/api/entries/week?startDate=2026-03-09")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("returns 400 without startDate", async () => {
    const res = await request(app)
      .get("/api/entries/week")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe("PUT /api/entries/:id", () => {
  it("updates an entry", async () => {
    const created = await request(app)
      .post("/api/entries")
      .set("Authorization", `Bearer ${token}`)
      .send(entryData);

    const res = await request(app)
      .put(`/api/entries/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Grilled Chicken" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Grilled Chicken");
  });

  it("returns 404 for non-existent entry", async () => {
    const res = await request(app)
      .put("/api/entries/nonexistent-id")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "X" });

    expect(res.status).toBe(404);
  });

  it("returns 404 when updating another users entry", async () => {
    const created = await request(app)
      .post("/api/entries")
      .set("Authorization", `Bearer ${token}`)
      .send(entryData);

    const other = await createTestUser("other@test.com");
    const otherToken = signToken(other.id);

    const res = await request(app)
      .put(`/api/entries/${created.body.data.id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ name: "Hacked" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/entries/:id", () => {
  it("deletes an entry", async () => {
    const created = await request(app)
      .post("/api/entries")
      .set("Authorization", `Bearer ${token}`)
      .send(entryData);

    const res = await request(app)
      .delete(`/api/entries/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("returns 404 for non-existent entry", async () => {
    const res = await request(app)
      .delete("/api/entries/nonexistent-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("GET /api/entries/recent", () => {
  it("returns recent foods ordered by most recent", async () => {
    const auth = { Authorization: `Bearer ${token}` };

    // Create entries with some duplicate names
    await request(app)
      .post("/api/entries")
      .set(auth)
      .send({ ...entryData, name: "Oats", date: "2026-03-10" });
    await request(app)
      .post("/api/entries")
      .set(auth)
      .send({ ...entryData, name: "Chicken Breast", date: "2026-03-11" });
    await request(app)
      .post("/api/entries")
      .set(auth)
      .send({ ...entryData, name: "Oats", date: "2026-03-12" }); // duplicate name
    await request(app)
      .post("/api/entries")
      .set(auth)
      .send({ ...entryData, name: "Rice", date: "2026-03-13" });

    const res = await request(app).get("/api/entries/recent").set(auth);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4); // no dedup — all 4 entries returned
    expect(res.body.data[0].name).toBe("Rice");
  });

  it("returns max 20 items", async () => {
    const auth = { Authorization: `Bearer ${token}` };

    for (let i = 0; i < 25; i++) {
      await request(app)
        .post("/api/entries")
        .set(auth)
        .send({ ...entryData, name: `Food ${i}`, date: "2026-03-15" });
    }

    const res = await request(app).get("/api/entries/recent").set(auth);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(20);
  });

  it("does not return other users entries", async () => {
    const auth = { Authorization: `Bearer ${token}` };
    await request(app).post("/api/entries").set(auth).send(entryData);

    const other = await createTestUser("other@test.com");
    const otherToken = signToken(other.id);

    const res = await request(app)
      .get("/api/entries/recent")
      .set({ Authorization: `Bearer ${otherToken}` });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/entries/recent");
    expect(res.status).toBe(401);
  });
});
