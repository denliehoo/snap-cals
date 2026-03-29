import type { User } from "@prisma/client";
import { FREE_DAILY_AI_LIMIT, type SubscriptionTier } from "@snap-cals/shared";
import type { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getUsage = async (req: Request, res: Response) => {
  const user = req.user as User;
  const period = new Date().toISOString().slice(0, 10);
  const usage = await prisma.aiUsage.findUnique({
    where: { userId_period: { userId: user.id, period } },
  });

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  res.json({
    data: {
      used: usage?.count ?? 0,
      limit: FREE_DAILY_AI_LIMIT,
      resetsAt: tomorrow.toISOString(),
      tier: user.subscriptionTier as SubscriptionTier,
    },
  });
};
