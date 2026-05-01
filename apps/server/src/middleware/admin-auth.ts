import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface AdminJwtPayload {
  sub: string;
  role: string;
}

export const authenticateAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET ?? "",
    ) as AdminJwtPayload;
    if (payload.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
