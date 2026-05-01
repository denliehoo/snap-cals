import {
  type CreateAdminRequest,
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "@snap-cals/shared";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import adminPrisma from "../lib/admin-prisma";

export const list = async (_req: Request, res: Response) => {
  try {
    const admins = await adminPrisma.admin.findMany({
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ data: admins });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const create = async (
  req: Request<{}, {}, CreateAdminRequest>,
  res: Response,
) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res
        .status(400)
        .json({ message: "Email, name, and password are required" });
    }
    if (email.length > EMAIL_MAX_LENGTH) {
      return res.status(400).json({
        message: `Email must be ${EMAIL_MAX_LENGTH} characters or less`,
      });
    }
    if (password.length < 6 || password.length > PASSWORD_MAX_LENGTH) {
      return res.status(400).json({
        message: `Password must be 6–${PASSWORD_MAX_LENGTH} characters`,
      });
    }

    const existing = await adminPrisma.admin.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await adminPrisma.admin.create({
      data: { email, name, passwordHash },
    });

    return res.status(201).json({
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        createdAt: admin.createdAt,
      },
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
