import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

const skip = isTest ? (_req: Request, _res: Response) => true : undefined;

/** Auth routes: 20 requests per 15 minutes per IP */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { message: "Too many requests, please try again later" },
});

/** AI routes: 30 requests per 15 minutes per IP */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { message: "Too many requests, please try again later" },
});

/** Admin auth routes: 20 requests per 15 minutes per IP */
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { message: "Too many requests, please try again later" },
});
