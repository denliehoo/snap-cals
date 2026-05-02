import type { UpdatePlatformSettingsRequest } from "@snap-cals/shared";
import type { Request, Response } from "express";
import adminPrisma from "../lib/admin-prisma";
import { clearSettingsCache } from "../services/settings.service";

export const getSettings = async (_req: Request, res: Response) => {
  try {
    const rows = await adminPrisma.platformSetting.findMany();
    const settings: Record<string, boolean> = {};
    for (const row of rows) {
      settings[row.key] = row.value === "true";
    }
    return res.json({ data: settings });
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
    if (updates.signupEnabled !== undefined) {
      await adminPrisma.platformSetting.upsert({
        where: { key: "signupEnabled" },
        update: { value: String(updates.signupEnabled) },
        create: { key: "signupEnabled", value: String(updates.signupEnabled) },
      });
      clearSettingsCache();
    }

    const rows = await adminPrisma.platformSetting.findMany();
    const settings: Record<string, boolean> = {};
    for (const row of rows) {
      settings[row.key] = row.value === "true";
    }
    return res.json({ data: settings });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
