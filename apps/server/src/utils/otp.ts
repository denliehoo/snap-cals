import crypto from "node:crypto";
import bcrypt from "bcryptjs";

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export function verifyOtp(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
