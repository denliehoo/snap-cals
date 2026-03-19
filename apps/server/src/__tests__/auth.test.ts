import request from "supertest";
import app from "../app";
import { cleanDb, createTestUser, prisma } from "./helpers";

beforeEach(() => cleanDb());
afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("POST /api/auth/signup", () => {
  it("creates a user and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "new@test.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("new@test.com");
  });

  it("returns 409 for duplicate email", async () => {
    await createTestUser("dup@test.com");
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "dup@test.com", password: "password123" });

    expect(res.status).toBe(409);
  });

  it("returns 400 when email or password missing", async () => {
    const res = await request(app).post("/api/auth/signup").send({ email: "" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when password too short", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "a@b.com", password: "123" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token for valid credentials", async () => {
    await createTestUser("login@test.com", "password123");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it("returns 401 for wrong password", async () => {
    await createTestUser("login@test.com", "password123");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: "wrong" });

    expect(res.status).toBe(401);
  });

  it("returns 401 for non-existent user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "password123" });

    expect(res.status).toBe(401);
  });

  it("returns 400 when fields missing", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
});
