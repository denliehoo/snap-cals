import type { LoginRequest, SignupRequest } from "@snap-cals/shared";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });

export const signup = async (
  req: Request<{}, {}, SignupRequest>,
  res: Response,
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    const token = signToken(user.id);
    return res.status(201).json({
      data: {
        token,
        user: { id: user.id, email: user.email, createdAt: user.createdAt },
      },
    });
  } catch (_err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response,
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user.id);
    return res.json({
      data: {
        token,
        user: { id: user.id, email: user.email, createdAt: user.createdAt },
      },
    });
  } catch (_err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
