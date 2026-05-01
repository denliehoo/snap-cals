import {
  type AdminLoginRequest,
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "@snap-cals/shared";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import adminPrisma from "../lib/admin-prisma";

const signAdminToken = (adminId: string) =>
  jwt.sign(
    { sub: adminId, role: "admin" },
    process.env.ADMIN_JWT_SECRET ?? "",
    { expiresIn: "7d" },
  );

const adminProfile = (admin: {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}) => ({
  id: admin.id,
  email: admin.email,
  name: admin.name,
  createdAt: admin.createdAt,
});

export const login = async (
  req: Request<{}, {}, AdminLoginRequest>,
  res: Response,
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    if (
      email.length > EMAIL_MAX_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const admin = await adminPrisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signAdminToken(admin.id);
    return res.json({ data: { token, admin: adminProfile(admin) } });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
