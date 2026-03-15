import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: "1h" });
}

export async function createTestUser(email = "test@test.com", password = "password123") {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({ data: { email, passwordHash } });
}

export async function cleanDb() {
  await prisma.foodEntry.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.user.deleteMany();
}

export { prisma };
