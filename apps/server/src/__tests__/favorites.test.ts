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

const favoriteData = {
  name: "Chicken Breast",
  calories: 300,
  protein: 40,
  carbs: 0,
  fat: 8,
  servingSize: "200g",
  mealType: "LUNCH",
};

describe("POST /api/favorites", () => {
  it("creates a favorite", async () => {
    const res = await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send(favoriteData);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Chicken Breast");
  });

  it("returns 409 for duplicate name", async () => {
    await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send(favoriteData);

    const res = await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send(favoriteData);

    expect(res.status).toBe(409);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Oats" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/favorites", () => {
  it("lists favorites for the user", async () => {
    await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send(favoriteData);

    const res = await request(app)
      .get("/api/favorites")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Chicken Breast");
  });
});

describe("DELETE /api/favorites/:id", () => {
  it("deletes a favorite", async () => {
    const created = await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send(favoriteData);

    const res = await request(app)
      .delete(`/api/favorites/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const list = await request(app)
      .get("/api/favorites")
      .set("Authorization", `Bearer ${token}`);

    expect(list.body.data).toHaveLength(0);
  });

  it("returns 404 for non-existent favorite", async () => {
    const res = await request(app)
      .delete("/api/favorites/nonexistent-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("cannot delete another users favorite", async () => {
    const created = await request(app)
      .post("/api/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send(favoriteData);

    const other = await createTestUser("other@test.com");
    const otherToken = signToken(other.id);

    const res = await request(app)
      .delete(`/api/favorites/${created.body.data.id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});
