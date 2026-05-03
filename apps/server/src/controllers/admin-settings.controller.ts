import {
  DEFAULT_FREE_DAILY_AI_LIMIT,
  type PlatformSettings,
  type UpdatePlatformSettingsRequest,
} from "@snap-cals/shared";
import type { Request, Response } from "express";
import adminPrisma from "../lib/admin-prisma";
import { clearSettingsCache } from "../services/settings.service";

function parseSettings(
  rows: { key: string; value: string }[],
): PlatformSettings {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    signupEnabled: map.get("signupEnabled") !== "false",
    freeDailyAiLimit: Number.parseInt(
      map.get("freeDailyAiLimit") ?? String(DEFAULT_FREE_DAILY_AI_LIMIT),
      10,
    ),
  };
}

export const getSettings = async (_req: Request, res: Response) => {
  try {
    const rows = await adminPrisma.platformSetting.findMany();
    return res.json({ data: parseSettings(rows) });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateSettings = async (
  req: Request<{}, {}, UpdatePlatformSettingsRequest>,
  res: Response,
) => {
  try {
    const updates = req.body;

    if (updates.freeDailyAiLimit !== undefined) {
      const val = updates.freeDailyAiLimit;
      if (!Number.isInteger(val) || val < 1 || val > 20) {
        return res.status(400).json({
          message: "freeDailyAiLimit must be an integer between 1 and 20",
        });
      }
    }

    if (updates.signupEnabled !== undefined) {
      await adminPrisma.platformSetting.upsert({
        where: { key: "signupEnabled" },
        update: { value: String(updates.signupEnabled) },
        create: { key: "signupEnabled", value: String(updates.signupEnabled) },
      });
    }

    if (updates.freeDailyAiLimit !== undefined) {
      await adminPrisma.platformSetting.upsert({
        where: { key: "freeDailyAiLimit" },
        update: { value: String(updates.freeDailyAiLimit) },
        create: {
          key: "freeDailyAiLimit",
          value: String(updates.freeDailyAiLimit),
        },
      });
    }

    clearSettingsCache();

    const rows = await adminPrisma.platformSetting.findMany();
    return res.json({ data: parseSettings(rows) });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
