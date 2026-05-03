import request from "supertest";
import app from "../app";
import { cleanDb, createTestUser, prisma } from "./helpers";

const API_KEY = process.env.API_KEY ?? "";

// Mock the email service
jest.mock("../services/email.service", () => ({
  sendVerificationCode: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetCode: jest.fn().mockResolvedValue(undefined),
}));

// Mock google-auth-library
jest.mock("google-auth-library", () => {
  const mockVerifyIdToken = jest.fn();
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
    __mockVerifyIdToken: mockVerifyIdToken,
  };
});

const { __mockVerifyIdToken: mockVerifyIdToken } = jest.requireMock(
  "google-auth-library",
);

const { sendVerificationCode, sendPasswordResetCode } = jest.requireMock(
  "../services/email.service",
);

beforeEach(async () => {
  await cleanDb();
  jest.clearAllMocks();
});
afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

// ─── Signup ──────────────────────────────────────────────────────────────────

describe("POST /api/auth/signup", () => {
  it("creates a user and returns userId with status UNVERIFIED", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .set("x-api-key", API_KEY)
      .send({ email: "new@test.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.data.userId).toBeDefined();
    expect(res.body.data.status).toBe("UNVERIFIED");
    expect(res.body.data.token).toBeUndefined();
    expect(sendVerificationCode).toHaveBeenCalledWith(
      "new@test.com",
      expect.any(String),
    );
  });

  it("returns 409 for duplicate email", async () => {
    await createTestUser("dup@test.com");
    const res = await request(app)
      .post("/api/auth/signup")
      .set("x-api-key", API_KEY)
      .send({ email: "dup@test.com", password: "password123" });

    expect(res.status).toBe(409);
  });

  it("returns 400 when email or password missing", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .set("x-api-key", API_KEY)
      .send({ email: "" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when password too short", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .set("x-api-key", API_KEY)
      .send({ email: "a@b.com", password: "123" });

    expect(res.status).toBe(400);
  });
});

// ─── Verify Email ────────────────────────────────────────────────────────────

describe("POST /api/auth/verify-email", () => {
  it("verifies email with correct code and returns JWT", async () => {
    // Signup to get a userId and OTP
    const signupRes = await request(app)
      .post("/api/auth/signup")
      .set("x-api-key", API_KEY)
      .send({ email: "verify@test.com", password: "password123" });

    const userId = signupRes.body.data.userId;
    const sentCode = sendVerificationCode.mock.calls[0][1];

    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("x-api-key", API_KEY)
      .send({ userId, code: sentCode });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.status).toBe("VERIFIED");
  });

  it("returns 400 for wrong code", async () => {
    const signupRes = await request(app)
      .post("/api/auth/signup")
      .set("x-api-key", API_KEY)
      .send({ email: "wrong@test.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("x-api-key", API_KEY)
      .send({ userId: signupRes.body.data.userId, code: "000000" });

    expect(res.status).toBe(400);
  });

  it("returns 400 for expired OTP", async () => {
    const signupRes = await request(app)
      .post("/api/auth/signup")
      .set("x-api-key", API_KEY)
      .send({ email: "expired@test.com", password: "password123" });

    const userId = signupRes.body.data.userId;
    const sentCode = sendVerificationCode.mock.calls[0][1];

    // Expire the OTP
    await prisma.otp.updateMany({
      where: { userId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("x-api-key", API_KEY)
      .send({ userId, code: sentCode });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("expired");
  });

  it("returns 400 for already-used OTP", async () => {
    const signupRes = await request(app)
      .post("/api/auth/signup")
      .set("x-api-key", API_KEY)
      .send({ email: "used@test.com", password: "password123" });

    const userId = signupRes.body.data.userId;
    const sentCode = sendVerificationCode.mock.calls[0][1];

    // Use the OTP
    await request(app)
      .post("/api/auth/verify-email")
      .set("x-api-key", API_KEY)
      .send({ userId, code: sentCode });

    // Try again
    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("x-api-key", API_KEY)
      .send({ userId, code: sentCode });

    expect(res.status).toBe(400);
  });
});

// ─── Resend Verification ─────────────────────────────────────────────────────

describe("POST /api/auth/resend-verification", () => {
  it("sends a new verification code", async () => {
    const signupRes = await request(app)
      .post("/api/auth/signup")
      .set("x-api-key", API_KEY)
      .send({ email: "resend@test.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/resend-verification")
      .set("x-api-key", API_KEY)
      .send({ userId: signupRes.body.data.userId });

    expect(res.status).toBe(200);
    // Called once on signup, once on resend
    expect(sendVerificationCode).toHaveBeenCalledTimes(2);
  });

  it("returns 400 for already-verified user", async () => {
    const user = await createTestUser("verified@test.com");

    const res = await request(app)
      .post("/api/auth/resend-verification")
      .set("x-api-key", API_KEY)
      .send({ userId: user.id });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("already verified");
  });
});

// ─── Login ───────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("returns a token for verified user", async () => {
    await createTestUser("login@test.com", "password123");
    const res = await request(app)
      .post("/api/auth/login")
      .set("x-api-key", API_KEY)
      .send({ email: "login@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it("returns userId and status UNVERIFIED for unverified user", async () => {
    // Signup creates an unverified user
    const signupRes = await request(app)
      .post("/api/auth/signup")
      .set("x-api-key", API_KEY)
      .send({ email: "unverified@test.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .set("x-api-key", API_KEY)
      .send({ email: "unverified@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe(signupRes.body.data.userId);
    expect(res.body.data.status).toBe("UNVERIFIED");
    expect(res.body.data.token).toBeUndefined();
  });

  it("returns 401 for wrong password", async () => {
    await createTestUser("login@test.com", "password123");
    const res = await request(app)
      .post("/api/auth/login")
      .set("x-api-key", API_KEY)
      .send({ email: "login@test.com", password: "wrong" });

    expect(res.status).toBe(401);
  });

  it("returns 401 for non-existent user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("x-api-key", API_KEY)
      .send({ email: "nobody@test.com", password: "password123" });

    expect(res.status).toBe(401);
  });

  it("returns 400 when fields missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("x-api-key", API_KEY)
      .send({});
    expect(res.status).toBe(400);
  });
});

// ─── Forgot Password ────────────────────────────────────────────────────────

describe("POST /api/auth/forgot-password", () => {
  it("sends reset code for existing user", async () => {
    await createTestUser("forgot@test.com");

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .set("x-api-key", API_KEY)
      .send({ email: "forgot@test.com" });

    expect(res.status).toBe(200);
    expect(sendPasswordResetCode).toHaveBeenCalledWith(
      "forgot@test.com",
      expect.any(String),
    );
  });

  it("returns 200 for non-existent email (no enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .set("x-api-key", API_KEY)
      .send({ email: "nobody@test.com" });

    expect(res.status).toBe(200);
    expect(sendPasswordResetCode).not.toHaveBeenCalled();
  });

  it("returns 200 but does not send email for OAuth-only user", async () => {
    await prisma.user.create({
      data: {
        email: "oauth@test.com",
        status: "VERIFIED",
        authProviders: {
          create: { provider: "GOOGLE", providerUserId: "google-123" },
        },
      },
    });

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .set("x-api-key", API_KEY)
      .send({ email: "oauth@test.com" });

    expect(res.status).toBe(200);
    expect(sendPasswordResetCode).not.toHaveBeenCalled();
  });
});

// ─── Reset Password ─────────────────────────────────────────────────────────

describe("POST /api/auth/reset-password", () => {
  it("resets password with correct code", async () => {
    await createTestUser("reset@test.com", "oldpassword");

    await request(app)
      .post("/api/auth/forgot-password")
      .set("x-api-key", API_KEY)
      .send({ email: "reset@test.com" });

    const sentCode = sendPasswordResetCode.mock.calls[0][1];

    const res = await request(app)
      .post("/api/auth/reset-password")
      .set("x-api-key", API_KEY)
      .send({
        email: "reset@test.com",
        code: sentCode,
        newPassword: "newpassword123",
      });

    expect(res.status).toBe(200);

    // Login with new password works
    const loginRes = await request(app)
      .post("/api/auth/login")
      .set("x-api-key", API_KEY)
      .send({ email: "reset@test.com", password: "newpassword123" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();
  });

  it("returns 400 for wrong code", async () => {
    await createTestUser("reset2@test.com");

    await request(app)
      .post("/api/auth/forgot-password")
      .set("x-api-key", API_KEY)
      .send({ email: "reset2@test.com" });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .set("x-api-key", API_KEY)
      .send({
        email: "reset2@test.com",
        code: "000000",
        newPassword: "newpass123",
      });

    expect(res.status).toBe(400);
  });

  it("returns 400 for expired OTP", async () => {
    const user = await createTestUser("reset3@test.com");

    await request(app)
      .post("/api/auth/forgot-password")
      .set("x-api-key", API_KEY)
      .send({ email: "reset3@test.com" });

    const sentCode = sendPasswordResetCode.mock.calls[0][1];

    await prisma.otp.updateMany({
      where: { userId: user.id, type: "PASSWORD_RESET" },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .set("x-api-key", API_KEY)
      .send({
        email: "reset3@test.com",
        code: sentCode,
        newPassword: "newpass123",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("expired");
  });

  it("returns 400 for password too short", async () => {
    await createTestUser("reset4@test.com");

    await request(app)
      .post("/api/auth/forgot-password")
      .set("x-api-key", API_KEY)
      .send({ email: "reset4@test.com" });

    const sentCode = sendPasswordResetCode.mock.calls[0][1];

    const res = await request(app)
      .post("/api/auth/reset-password")
      .set("x-api-key", API_KEY)
      .send({ email: "reset4@test.com", code: sentCode, newPassword: "123" });

    expect(res.status).toBe(400);
  });
});

// ─── Google OAuth ────────────────────────────────────────────────────────────

describe("POST /api/auth/google", () => {
  const mockGooglePayload = (overrides = {}) => ({
    sub: "google-user-123",
    email: "google@test.com",
    email_verified: true,
    name: "Test User",
    ...overrides,
  });

  const setupMockVerify = (payload: ReturnType<typeof mockGooglePayload>) => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => payload,
    });
  };

  it("creates a new user for first-time Google login", async () => {
    setupMockVerify(mockGooglePayload());

    const res = await request(app)
      .post("/api/auth/google")
      .set("x-api-key", API_KEY)
      .send({ idToken: "valid-token" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("google@test.com");
    expect(res.body.data.user.status).toBe("VERIFIED");

    // Verify user has no password
    const user = await prisma.user.findUnique({
      where: { email: "google@test.com" },
    });
    expect(user?.passwordHash).toBeNull();
  });

  it("returns JWT for existing Google user (same sub)", async () => {
    setupMockVerify(mockGooglePayload());

    // First login
    await request(app)
      .post("/api/auth/google")
      .set("x-api-key", API_KEY)
      .send({ idToken: "valid-token" });

    // Second login
    const res = await request(app)
      .post("/api/auth/google")
      .set("x-api-key", API_KEY)
      .send({ idToken: "valid-token" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();

    // Only one user exists
    const users = await prisma.user.findMany({
      where: { email: "google@test.com" },
    });
    expect(users).toHaveLength(1);
  });

  it("links Google to existing email/password user", async () => {
    const existingUser = await createTestUser("link@test.com");

    setupMockVerify(mockGooglePayload({ email: "link@test.com" }));

    const res = await request(app)
      .post("/api/auth/google")
      .set("x-api-key", API_KEY)
      .send({ idToken: "valid-token" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(existingUser.id);

    // Auth provider was created
    const provider = await prisma.authProvider.findFirst({
      where: { userId: existingUser.id, provider: "GOOGLE" },
    });
    expect(provider).toBeTruthy();
  });

  it("returns 401 for invalid id_token", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

    const res = await request(app)
      .post("/api/auth/google")
      .set("x-api-key", API_KEY)
      .send({ idToken: "invalid-token" });

    expect(res.status).toBe(401);
  });

  it("returns 401 for unverified Google email", async () => {
    setupMockVerify(mockGooglePayload({ email_verified: false }));

    const res = await request(app)
      .post("/api/auth/google")
      .set("x-api-key", API_KEY)
      .send({ idToken: "valid-token" });

    expect(res.status).toBe(401);
  });

  it("returns 403 for deactivated user with linked Google account", async () => {
    await prisma.user.create({
      data: {
        email: "deactivated-google@test.com",
        status: "DEACTIVATED",
        authProviders: {
          create: { provider: "GOOGLE", providerUserId: "google-deact-123" },
        },
      },
    });

    setupMockVerify(
      mockGooglePayload({
        sub: "google-deact-123",
        email: "deactivated-google@test.com",
      }),
    );

    const res = await request(app)
      .post("/api/auth/google")
      .set("x-api-key", API_KEY)
      .send({ idToken: "valid-token" });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("deactivated");
  });

  it("returns 403 for deactivated user via email-match linking", async () => {
    await prisma.user.create({
      data: {
        email: "deact-link@test.com",
        status: "DEACTIVATED",
        passwordHash: "somehash",
      },
    });

    setupMockVerify(
      mockGooglePayload({
        sub: "google-new-sub",
        email: "deact-link@test.com",
      }),
    );

    const res = await request(app)
      .post("/api/auth/google")
      .set("x-api-key", API_KEY)
      .send({ idToken: "valid-token" });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("deactivated");
  });
});

// ─── Deactivated User Login ─────────────────────────────────────────────────

describe("Deactivated user login", () => {
  it("returns 403 for deactivated user on email/password login", async () => {
    const user = await createTestUser("deact@test.com", "password123");
    await prisma.user.update({
      where: { id: user.id },
      data: { status: "DEACTIVATED" },
    });

    const res = await request(app)
      .post("/api/auth/login")
      .set("x-api-key", API_KEY)
      .send({ email: "deact@test.com", password: "password123" });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("deactivated");
  });
});
