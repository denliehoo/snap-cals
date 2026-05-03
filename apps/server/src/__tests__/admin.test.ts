import { MealType } from "@prisma/client";
import request from "supertest";
import app from "../app";
import { cleanDb, createTestUser, prisma, signAdminToken } from "./helpers";

const API_KEY = process.env.API_KEY ?? "";
const adminToken = signAdminToken("admin-test-id");

function adminReq(method: "get" | "post" | "put" | "patch", path: string) {
  return request(app)
    [method](`/api/admin${path}`)
    .set("x-api-key", API_KEY)
    .set("Authorization", `Bearer ${adminToken}`);
}

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("Admin auth middleware", () => {
  it("returns 401 without admin token", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(401);
  });

  it("returns 401 with app user token (no admin role)", async () => {
    const { default: jwt } = await import("jsonwebtoken");
    const appToken = jwt.sign(
      { sub: "user-id" },
      process.env.ADMIN_JWT_SECRET ?? "",
      { expiresIn: "1h" },
    );
    const res = await request(app)
      .get("/api/admin/users")
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${appToken}`);
    expect(res.status).toBe(401);
  });

  it("returns 403 without API key", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });
});

describe("GET /api/admin/users", () => {
  it("returns paginated user list", async () => {
    await createTestUser("a@test.com");
    await createTestUser("b@test.com");

    const res = await adminReq("get", "/users?page=1&limit=10");
    expect(res.status).toBe(200);
    expect(res.body.data.users).toHaveLength(2);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.page).toBe(1);
  });

  it("filters by email search", async () => {
    await createTestUser("alice@test.com");
    await createTestUser("bob@test.com");

    const res = await adminReq("get", "/users?search=alice");
    expect(res.status).toBe(200);
    expect(res.body.data.users).toHaveLength(1);
    expect(res.body.data.users[0].email).toBe("alice@test.com");
  });
});

describe("GET /api/admin/users/:id", () => {
  it("returns user profile", async () => {
    const user = await createTestUser();
    const res = await adminReq("get", `/users/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("test@test.com");
  });

  it("returns 404 for unknown user", async () => {
    const res = await adminReq("get", "/users/nonexistent");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/admin/users/:id/entries", () => {
  it("returns entries for a date", async () => {
    const user = await createTestUser();
    const date = new Date("2025-01-15");
    await prisma.foodEntry.create({
      data: {
        userId: user.id,
        name: "Oatmeal",
        calories: 300,
        protein: 10,
        carbs: 50,
        fat: 8,
        servingSize: "1 bowl",
        mealType: MealType.BREAKFAST,
        date,
      },
    });

    const res = await adminReq(
      "get",
      `/users/${user.id}/entries?date=2025-01-15`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Oatmeal");
  });

  it("returns 400 without date", async () => {
    const user = await createTestUser();
    const res = await adminReq("get", `/users/${user.id}/entries`);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/admin/users/:id/entries/week", () => {
  it("returns entries for a week", async () => {
    const user = await createTestUser();
    await prisma.foodEntry.create({
      data: {
        userId: user.id,
        name: "Lunch",
        calories: 500,
        protein: 30,
        carbs: 40,
        fat: 20,
        servingSize: "1 plate",
        mealType: MealType.LUNCH,
        date: new Date("2025-01-15"),
      },
    });

    const res = await adminReq(
      "get",
      `/users/${user.id}/entries/week?startDate=2025-01-13`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe("PUT /api/admin/users/:id/entries/:entryId", () => {
  it("updates an entry", async () => {
    const user = await createTestUser();
    const entry = await prisma.foodEntry.create({
      data: {
        userId: user.id,
        name: "Old Name",
        calories: 100,
        protein: 5,
        carbs: 10,
        fat: 3,
        servingSize: "1 piece",
        mealType: MealType.SNACK,
        date: new Date("2025-01-15"),
      },
    });

    const res = await adminReq(
      "put",
      `/users/${user.id}/entries/${entry.id}`,
    ).send({ name: "New Name", calories: 200 });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("New Name");
    expect(res.body.data.calories).toBe(200);
  });

  it("returns 404 if entry belongs to different user", async () => {
    const user1 = await createTestUser("u1@test.com");
    const user2 = await createTestUser("u2@test.com");
    const entry = await prisma.foodEntry.create({
      data: {
        userId: user1.id,
        name: "Food",
        calories: 100,
        protein: 5,
        carbs: 10,
        fat: 3,
        servingSize: "1",
        mealType: MealType.SNACK,
        date: new Date("2025-01-15"),
      },
    });

    const res = await adminReq(
      "put",
      `/users/${user2.id}/entries/${entry.id}`,
    ).send({ name: "Hacked" });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/admin/users/:id/goals", () => {
  it("returns null when no goals set", async () => {
    const user = await createTestUser();
    const res = await adminReq("get", `/users/${user.id}/goals`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it("returns goals when set", async () => {
    const user = await createTestUser();
    await prisma.goal.create({
      data: {
        userId: user.id,
        dailyCalories: 2000,
        dailyProtein: 150,
        dailyCarbs: 250,
        dailyFat: 65,
      },
    });

    const res = await adminReq("get", `/users/${user.id}/goals`);
    expect(res.status).toBe(200);
    expect(res.body.data.dailyCalories).toBe(2000);
  });
});

describe("PUT /api/admin/users/:id/goals", () => {
  it("creates goals via upsert", async () => {
    const user = await createTestUser();
    const res = await adminReq("put", `/users/${user.id}/goals`).send({
      dailyCalories: 1800,
      dailyProtein: 140,
      dailyCarbs: 200,
      dailyFat: 60,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.dailyCalories).toBe(1800);
  });

  it("returns 400 for negative values", async () => {
    const user = await createTestUser();
    const res = await adminReq("put", `/users/${user.id}/goals`).send({
      dailyCalories: -1,
      dailyProtein: 140,
      dailyCarbs: 200,
      dailyFat: 60,
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown user", async () => {
    const res = await adminReq("put", "/users/nonexistent/goals").send({
      dailyCalories: 1800,
      dailyProtein: 140,
      dailyCarbs: 200,
      dailyFat: 60,
    });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/admin/users/:id/weight", () => {
  it("returns weight entries", async () => {
    const user = await createTestUser();
    await prisma.weightEntry.create({
      data: {
        userId: user.id,
        weightKg: 75,
        weightLbs: 165.35,
        loggedAt: new Date("2025-01-15T10:00:00Z"),
      },
    });

    const res = await adminReq("get", `/users/${user.id}/weight`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].weightKg).toBe(75);
  });

  it("filters by from date", async () => {
    const user = await createTestUser();
    await prisma.weightEntry.create({
      data: {
        userId: user.id,
        weightKg: 75,
        weightLbs: 165.35,
        loggedAt: new Date("2025-01-01T10:00:00Z"),
      },
    });
    await prisma.weightEntry.create({
      data: {
        userId: user.id,
        weightKg: 74,
        weightLbs: 163.14,
        loggedAt: new Date("2025-01-20T10:00:00Z"),
      },
    });

    const res = await adminReq(
      "get",
      `/users/${user.id}/weight?from=2025-01-15T00:00:00Z`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].weightKg).toBe(74);
  });
});

describe("PATCH /api/admin/users/:id/status", () => {
  it("updates user status to DEACTIVATED", async () => {
    const user = await createTestUser();
    const res = await adminReq("patch", `/users/${user.id}/status`).send({
      status: "DEACTIVATED",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("DEACTIVATED");
  });

  it("updates user status to UNVERIFIED", async () => {
    const user = await createTestUser();
    const res = await adminReq("patch", `/users/${user.id}/status`).send({
      status: "UNVERIFIED",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("UNVERIFIED");
  });

  it("updates user status to VERIFIED", async () => {
    const user = await createTestUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { status: "DEACTIVATED" },
    });
    const res = await adminReq("patch", `/users/${user.id}/status`).send({
      status: "VERIFIED",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("VERIFIED");
  });

  it("returns 400 for invalid status", async () => {
    const user = await createTestUser();
    const res = await adminReq("patch", `/users/${user.id}/status`).send({
      status: "INVALID",
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent user", async () => {
    const res = await adminReq("patch", "/users/nonexistent/status").send({
      status: "DEACTIVATED",
    });
    expect(res.status).toBe(404);
  });
});
