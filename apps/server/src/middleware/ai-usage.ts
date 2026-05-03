import type { User } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma";
import { getFreeDailyAiLimit } from "../services/settings.service";

function getResetsAt(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

export const checkAiUsage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user as User;
  if (user.subscriptionTier === "PRO") return next();

  const limit = await getFreeDailyAiLimit();
  const period = new Date().toISOString().slice(0, 10);
  const usage = await prisma.aiUsage.upsert({
    where: { userId_period: { userId: user.id, period } },
    create: { userId: user.id, period, count: 0 },
    update: {},
  });

  if (usage.count >= limit) {
    return res.status(429).json({
      message: "Daily AI limit reached",
      used: usage.count,
      limit,
      resetsAt: getResetsAt(),
    });
  }

  await prisma.aiUsage.update({
    where: { id: usage.id },
    data: { count: { increment: 1 } },
  });

  next();
};
