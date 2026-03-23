import type { Request, Response } from "express";
import prisma from "../lib/prisma";

const PRO_EVENTS = new Set(["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION"]);
const FREE_EVENTS = new Set(["EXPIRATION", "CANCELLATION"]);

export const handleRevenueCat = async (req: Request, res: Response) => {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { type, app_user_id } = req.body?.event ?? {};
  if (!type || !app_user_id) return res.sendStatus(200);

  const user = await prisma.user.findUnique({ where: { id: app_user_id } });
  if (!user) {
    console.warn(`RevenueCat webhook: user ${app_user_id} not found`);
    return res.sendStatus(200);
  }

  if (PRO_EVENTS.has(type)) {
    await prisma.user.update({ where: { id: user.id }, data: { subscriptionTier: "PRO" } });
  } else if (FREE_EVENTS.has(type)) {
    await prisma.user.update({ where: { id: user.id }, data: { subscriptionTier: "FREE" } });
  }

  res.sendStatus(200);
};
