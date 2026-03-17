import request from "supertest";
import app from "../app";
import { createTestUser, signToken, cleanDb, prisma } from "./helpers";
import * as chatService from "../services/chat.service";

jest.spyOn(chatService, "chat");

const MOCK_QUESTION = { message: "What size?" };
const MOCK_ESTIMATE = {
  message: "Here's your estimate",
  estimate: { name: "Big Mac", calories: 550, protein: 25, carbs: 45, fat: 30, servingSize: "1 burger" },
};

let token: string;

beforeEach(async () => {
  await cleanDb();
  const user = await createTestUser();
  token = signToken(user.id);
  (chatService.chat as jest.Mock).mockResolvedValue(MOCK_QUESTION);
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("POST /api/ai/chat", () => {
  it("returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .send({ messages: [{ role: "user", content: "big mac" }] });

    expect(res.status).toBe(401);
  });

  it("returns 400 with empty messages", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [] });

    expect(res.status).toBe(400);
  });

  it("returns 400 with missing messages", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 400 with invalid message role", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "system", content: "hi" }] });

    expect(res.status).toBe(400);
  });

  it("returns 400 when message content exceeds limit", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "user", content: "a".repeat(301) }] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/exceed/i);
  });

  it("returns 200 with question response", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "user", content: "big mac" }] });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(MOCK_QUESTION);
  });

  it("returns 200 with estimate response", async () => {
    (chatService.chat as jest.Mock).mockResolvedValue(MOCK_ESTIMATE);

    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "user", content: "big mac" }] });

    expect(res.status).toBe(200);
    expect(res.body.data.estimate).toBeDefined();
  });

  it("passes forceEstimate to service", async () => {
    await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "user", content: "big mac" }], forceEstimate: true });

    expect(chatService.chat).toHaveBeenCalledWith(
      [{ role: "user", content: "big mac" }],
      true,
      undefined,
    );
  });

  it("returns 429 on rate limit", async () => {
    const err: any = new Error("rate limited");
    err.status = 429;
    (chatService.chat as jest.Mock).mockRejectedValue(err);

    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "user", content: "pizza" }] });

    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/busy/i);
  });

  it("returns 500 on generic error", async () => {
    (chatService.chat as jest.Mock).mockRejectedValue(new Error("fail"));

    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "user", content: "pizza" }] });

    expect(res.status).toBe(500);
  });
});
