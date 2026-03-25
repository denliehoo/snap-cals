import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Test } from "supertest";
import prisma from "../lib/prisma";

const API_KEY = process.env.API_KEY ?? "";

/** Attach the x-api-key header to a supertest request */
export function withApiKey(req: Test) {
  return req.set("x-api-key", API_KEY);
}

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? "", {
    expiresIn: "1h",
  });
}

export async function createTestUser(
  email = "test@test.com",
  password = "password123",
) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { email, passwordHash, emailVerified: true },
  });
}

export async function cleanDb() {
  await prisma.aiUsage.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.authProvider.deleteMany();
  await prisma.foodEntry.deleteMany();
  await prisma.favoriteFood.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.user.deleteMany();
}

export { prisma };
