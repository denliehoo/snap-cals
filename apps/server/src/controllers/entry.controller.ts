import { MealType as PrismaMealType, type User } from "@prisma/client";
import type {
  CreateFoodEntryRequest,
  UpdateFoodEntryRequest,
} from "@snap-cals/shared";
import type { Request, Response } from "express";
import prisma from "../lib/prisma";

const userId = (req: Request) => (req.user as User).id;

export const create = async (
  req: Request<{}, {}, CreateFoodEntryRequest>,
  res: Response,
) => {
  try {
    const { name, calories, protein, carbs, fat, servingSize, mealType, date } =
      req.body;

    if (!name || calories == null || !mealType || !date) {
      return res
        .status(400)
        .json({ message: "name, calories, mealType, and date are required" });
    }

    if (!Object.values(PrismaMealType).includes(mealType)) {
      return res.status(400).json({ message: "Invalid meal type" });
    }

    const entry = await prisma.foodEntry.create({
      data: {
        userId: userId(req),
        name,
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        servingSize: servingSize || "",
        mealType,
        date: new Date(date),
      },
    });

    res.status(201).json({ data: entry });
  } catch (_error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "date is required" });

    const start = new Date(date as string);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const entries = await prisma.foodEntry.findMany({
      where: {
        userId: userId(req),
        date: { gte: start, lt: end },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ data: entries });
  } catch (_error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getByWeek = async (req: Request, res: Response) => {
  try {
    const { startDate } = req.query;
    if (!startDate)
      return res.status(400).json({ message: "startDate is required" });

    const start = new Date(startDate as string);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const entries = await prisma.foodEntry.findMany({
      where: {
        userId: userId(req),
        date: { gte: start, lt: end },
      },
      orderBy: { date: "asc" },
    });

    res.json({ data: entries });
  } catch (_error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const update = async (
  req: Request<{ id: string }, {}, UpdateFoodEntryRequest>,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const existing = await prisma.foodEntry.findFirst({
      where: { id, userId: userId(req) },
    });
    if (!existing) return res.status(404).json({ message: "Entry not found" });

    if (
      req.body.mealType &&
      !Object.values(PrismaMealType).includes(req.body.mealType)
    ) {
      return res.status(400).json({ message: "Invalid meal type" });
    }

    const { name, calories, protein, carbs, fat, servingSize, mealType, date } =
      req.body;

    const entry = await prisma.foodEntry.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(calories !== undefined && { calories: Number(calories) }),
        ...(protein !== undefined && { protein: Number(protein) }),
        ...(carbs !== undefined && { carbs: Number(carbs) }),
        ...(fat !== undefined && { fat: Number(fat) }),
        ...(servingSize !== undefined && { servingSize }),
        ...(mealType !== undefined && { mealType }),
        ...(date !== undefined && { date: new Date(date) }),
      },
    });

    res.json({ data: entry });
  } catch (_error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getRecent = async (req: Request, res: Response) => {
  try {
    const entries = await prisma.foodEntry.findMany({
      where: { userId: userId(req) },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        name: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        servingSize: true,
        mealType: true,
      },
    });

    res.json({ data: entries });
  } catch (_error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const remove = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.foodEntry.findFirst({
      where: { id, userId: userId(req) },
    });
    if (!existing) return res.status(404).json({ message: "Entry not found" });

    await prisma.foodEntry.delete({ where: { id } });
    res.json({ message: "Entry deleted" });
  } catch (_error) {
    res.status(500).json({ message: "Server error" });
  }
};
