import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { MealType as PrismaMealType, User } from "@prisma/client";
import { CreateFavoriteFoodRequest } from "@snap-cals/shared";

const userId = (req: Request) => (req.user as User).id;

export const create = async (req: Request<{}, {}, CreateFavoriteFoodRequest>, res: Response) => {
  try {
    const { name, calories, protein, carbs, fat, servingSize, mealType } = req.body;

    if (!name || calories == null || !mealType) {
      return res.status(400).json({ message: "name, calories, and mealType are required" });
    }

    if (!Object.values(PrismaMealType).includes(mealType)) {
      return res.status(400).json({ message: "Invalid meal type" });
    }

    const existing = await prisma.favoriteFood.findUnique({
      where: { userId_name: { userId: userId(req), name } },
    });
    if (existing) {
      return res.status(409).json({ message: "Favorite with this name already exists" });
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
        mealType,
      },
    });

    res.status(201).json({ data: favorite });
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const remove = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.favoriteFood.findFirst({
      where: { id, userId: userId(req) },
    });
    if (!existing) return res.status(404).json({ message: "Favorite not found" });

    await prisma.favoriteFood.delete({ where: { id } });
    res.json({ message: "Favorite deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
