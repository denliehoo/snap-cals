import type { User } from "@prisma/client";
import {
  type CreateWeightEntryRequest,
  type UpdateWeightEntryRequest,
  WEIGHT_NOTE_MAX_LENGTH,
} from "@snap-cals/shared";
import type { Request, Response } from "express";
import prisma from "../lib/prisma";

const KG_TO_LBS = 2.20462;
const userId = (req: Request) => (req.user as User).id;

function convertWeight(weight: number, unit: string) {
  return unit === "kg"
    ? { weightKg: weight, weightLbs: +(weight * KG_TO_LBS).toFixed(2) }
    : { weightKg: +(weight / KG_TO_LBS).toFixed(2), weightLbs: weight };
}

export const create = async (
  req: Request<{}, {}, CreateWeightEntryRequest>,
  res: Response,
) => {
  try {
    const { weight, unit, loggedAt, note } = req.body;
    if (!weight || weight <= 0 || !unit || !loggedAt) {
      return res
        .status(400)
        .json({ message: "weight, unit, and loggedAt are required" });
    }
    if (note && note.length > WEIGHT_NOTE_MAX_LENGTH) {
      return res.status(400).json({
        message: `note must be ${WEIGHT_NOTE_MAX_LENGTH} characters or less`,
      });
    }
    const entry = await prisma.weightEntry.create({
      data: {
        userId: userId(req),
        ...convertWeight(weight, unit),
        note: note || null,
        loggedAt: new Date(loggedAt),
      },
    });
    res.status(201).json({ data: entry });
  } catch (_error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: "from and to are required" });
    }
    const entries = await prisma.weightEntry.findMany({
      where: {
        userId: userId(req),
        loggedAt: {
          gte: new Date(from as string),
          lte: new Date(to as string),
        },
      },
      orderBy: { loggedAt: "desc" },
    });
    res.json({ data: entries });
  } catch (_error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const update = async (
  req: Request<{ id: string }, {}, UpdateWeightEntryRequest>,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const existing = await prisma.weightEntry.findFirst({
      where: { id, userId: userId(req) },
    });
    if (!existing) return res.status(404).json({ message: "Entry not found" });

    const { weight, unit, loggedAt, note } = req.body;
    if (note && note.length > WEIGHT_NOTE_MAX_LENGTH) {
      return res.status(400).json({
        message: `note must be ${WEIGHT_NOTE_MAX_LENGTH} characters or less`,
      });
    }
    const weightData = weight && unit ? convertWeight(weight, unit) : {};

    const entry = await prisma.weightEntry.update({
      where: { id },
      data: {
        ...weightData,
        ...(loggedAt !== undefined && { loggedAt: new Date(loggedAt) }),
        ...(note !== undefined && { note: note || null }),
      },
    });
    res.json({ data: entry });
  } catch (_error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const remove = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.weightEntry.findFirst({
      where: { id, userId: userId(req) },
    });
    if (!existing) return res.status(404).json({ message: "Entry not found" });

    await prisma.weightEntry.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (_error) {
    res.status(500).json({ message: "Server error" });
  }
};
