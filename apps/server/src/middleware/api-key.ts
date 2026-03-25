import type { NextFunction, Request, Response } from "express";

export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.headers["x-api-key"] !== process.env.API_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
