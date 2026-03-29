import { MealType as PrismaMealType, type User } from "@prisma/client";
import {
  AI_SOURCE_MAX_LENGTH,
  FOOD_NAME_MAX_LENGTH,
  SERVING_SIZE_MAX_LENGTH,
  type CreateFavoriteFoodRequest,
} from "@snap-cals/shared";
import type { Request, Response } from "express";
import prisma from "../lib/prisma";

const userId = (req: Request) => (req.user as User).id;
const MAX_FAVORITES = 25;

export const create = async (
  req: Request<{}, {}, CreateFavoriteFoodRequest>,
  res: Response,
) => {
  try {
    const {
      name,
      calories,
      protein,
      carbs,
      fat,
      servingSize,
      source,
      mealType,
    } = req.body;

    if (!name || calories == null || !mealType) {
      return res
        .status(400)
        .json({ message: "name, calories, and mealType are required" });
    }

    if (!Object.values(PrismaMealType).includes(mealType)) {
      return res.status(400).json({ message: "Invalid meal type" });
    }

    if (name.length > FOOD_NAME_MAX_LENGTH) {
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

    const existing = await prisma.favoriteFood.findUnique({
      where: { userId_name: { userId: userId(req), name } },
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: `A favorite named "${name}" already exists` });
    }

    const count = await prisma.favoriteFood.count({
      where: { userId: userId(req) },
    });
    if (count >= MAX_FAVORITES) {
      return res
        .status(409)
        .json({ message: "Favorites full — remove one to add another" });
    }

    const favorite = await prisma.favoriteFood.create({
      data: {
        userId: userId(req),
        name,
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        servingSize: servingSize || "",
        source: source || null,
        mealType,
      },
    });

    res.status(201).json({ data: favorite });
  } catch (_error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const favorites = await prisma.favoriteFood.findMany({
      where: { userId: userId(req) },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: favorites });
  } catch (_error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const remove = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.favoriteFood.findFirst({
      where: { id, userId: userId(req) },
    });
    if (!existing)
      return res.status(404).json({ message: "Favorite not found" });

    await prisma.favoriteFood.delete({ where: { id } });
    res.json({ message: "Favorite deleted" });
  } catch (_error) {
    res.status(500).json({ message: "Server error" });
  }
};
