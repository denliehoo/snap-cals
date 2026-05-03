import {
  MealType as PrismaMealType,
  UserStatus as PrismaUserStatus,
} from "@prisma/client";
import {
  type AdminUpdateEntryRequest,
  type AdminUpdateGoalRequest,
  type AdminUpdateUserStatusRequest,
  AI_SOURCE_MAX_LENGTH,
  FOOD_NAME_MAX_LENGTH,
  SERVING_SIZE_MAX_LENGTH,
} from "@snap-cals/shared";
import type { Request, Response } from "express";
import prisma from "../lib/prisma";

export const listUsers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = (req.query.search as string) || "";

    const where = search
      ? { email: { contains: search, mode: "insensitive" as const } }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          subscriptionTier: true,
          createdAt: true,
          status: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({ data: { users, total, page, limit } });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUser = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        createdAt: true,
        status: true,
      },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ data: user });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserEntries = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "date is required" });

    const start = new Date(date as string);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const entries = await prisma.foodEntry.findMany({
      where: { userId: req.params.id, date: { gte: start, lt: end } },
      orderBy: { createdAt: "asc" },
    });
    return res.json({ data: entries });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserWeekEntries = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { startDate } = req.query;
    if (!startDate)
      return res.status(400).json({ message: "startDate is required" });

    const start = new Date(startDate as string);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const entries = await prisma.foodEntry.findMany({
      where: { userId: req.params.id, date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    });
    return res.json({ data: entries });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserEntry = async (
  req: Request<{ id: string; entryId: string }, {}, AdminUpdateEntryRequest>,
  res: Response,
) => {
  try {
    const { id, entryId } = req.params;

    const existing = await prisma.foodEntry.findFirst({
      where: { id: entryId, userId: id },
    });
    if (!existing) return res.status(404).json({ message: "Entry not found" });

    const {
      name,
      calories,
      protein,
      carbs,
      fat,
      servingSize,
      source,
      mealType,
      date,
    } = req.body;

    if (
      mealType &&
      !Object.values(PrismaMealType).includes(mealType as PrismaMealType)
    ) {
      return res.status(400).json({ message: "Invalid meal type" });
    }
    if (name !== undefined && name.length > FOOD_NAME_MAX_LENGTH) {
      return res.status(400).json({
        message: `name must be ${FOOD_NAME_MAX_LENGTH} characters or less`,
      });
    }
    if (servingSize && servingSize.length > SERVING_SIZE_MAX_LENGTH) {
      return res.status(400).json({
        message: `servingSize must be ${SERVING_SIZE_MAX_LENGTH} characters or less`,
      });
    }
    if (source && source.length > AI_SOURCE_MAX_LENGTH) {
      return res.status(400).json({
        message: `source must be ${AI_SOURCE_MAX_LENGTH} characters or less`,
      });
    }

    const entry = await prisma.foodEntry.update({
      where: { id: entryId },
      data: {
        ...(name !== undefined && { name }),
        ...(calories !== undefined && { calories: Number(calories) }),
        ...(protein !== undefined && { protein: Number(protein) }),
        ...(carbs !== undefined && { carbs: Number(carbs) }),
        ...(fat !== undefined && { fat: Number(fat) }),
        ...(servingSize !== undefined && { servingSize }),
        ...(source !== undefined && { source: source || null }),
        ...(mealType !== undefined && { mealType: mealType as PrismaMealType }),
        ...(date !== undefined && { date: new Date(date) }),
      },
    });
    return res.json({ data: entry });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserGoals = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const goal = await prisma.goal.findUnique({
      where: { userId: req.params.id },
    });
    return res.json({ data: goal });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserGoals = async (
  req: Request<{ id: string }, {}, AdminUpdateGoalRequest>,
  res: Response,
) => {
  try {
    const { dailyCalories, dailyProtein, dailyCarbs, dailyFat } = req.body;
    if (
      [dailyCalories, dailyProtein, dailyCarbs, dailyFat].some(
        (v) => v == null || v < 0,
      )
    ) {
      return res
        .status(400)
        .json({ message: "All goal values are required and must be >= 0" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const data = { dailyCalories, dailyProtein, dailyCarbs, dailyFat };
    const goal = await prisma.goal.upsert({
      where: { userId: req.params.id },
      update: data,
      create: { ...data, userId: req.params.id },
    });
    return res.json({ data: goal });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserWeight = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { from } = req.query;
    const where: Record<string, unknown> = { userId: req.params.id };
    if (from) {
      where.loggedAt = { gte: new Date(from as string) };
    }

    const entries = await prisma.weightEntry.findMany({
      where,
      orderBy: { loggedAt: "desc" },
    });
    return res.json({ data: entries });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserStatus = async (
  req: Request<{ id: string }, {}, AdminUpdateUserStatusRequest>,
  res: Response,
) => {
  try {
    const { status } = req.body;
    if (!Object.values(PrismaUserStatus).includes(status as PrismaUserStatus)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: status as PrismaUserStatus },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        createdAt: true,
        status: true,
      },
    });
    return res.json({ data: updated });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
