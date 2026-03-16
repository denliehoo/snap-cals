import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { User } from "@prisma/client";
import { UpsertGoalRequest } from "@snap-cals/shared";

const userId = (req: Request) => (req.user as User).id;

const DEFAULT_GOALS = {
  dailyCalories: 2000,
  dailyProtein: 150,
  dailyCarbs: 250,
  dailyFat: 65,
};

export const get = async (req: Request, res: Response) => {
  try {
    const goal = await prisma.goal.findUnique({ where: { userId: userId(req) } });
    res.json({ data: goal || { ...DEFAULT_GOALS, userId: userId(req) } });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const upsert = async (req: Request<{}, {}, UpsertGoalRequest>, res: Response) => {
  try {
    const { dailyCalories, dailyProtein, dailyCarbs, dailyFat } = req.body;
    if ([dailyCalories, dailyProtein, dailyCarbs, dailyFat].some((v) => v == null || v < 0)) {
      return res.status(400).json({ message: "All goal values are required and must be >= 0" });
    }
    const data = { dailyCalories, dailyProtein, dailyCarbs, dailyFat };
    const goal = await prisma.goal.upsert({
      where: { userId: userId(req) },
      update: data,
      create: { ...data, userId: userId(req) },
    });
    res.json({ data: goal });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
