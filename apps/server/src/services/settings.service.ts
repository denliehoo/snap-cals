import { DEFAULT_FREE_DAILY_AI_LIMIT } from "@snap-cals/shared";
import adminPrisma from "../lib/admin-prisma";

const CACHE_TTL_MS = 60_000; // 60 seconds
let cachedSignupEnabled: boolean | null = null;
let cachedFreeDailyAiLimit: number | null = null;
let cacheTimestamp = 0;

export async function isSignupEnabled(): Promise<boolean> {
  const now = Date.now();
  if (cachedSignupEnabled !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSignupEnabled;
  }

  try {
    const setting = await adminPrisma.platformSetting.findUnique({
      where: { key: "signupEnabled" },
    });
    cachedSignupEnabled = setting?.value !== "false";
    cacheTimestamp = now;
    return cachedSignupEnabled;
  } catch {
    // Fail-open: allow signups if admin DB is unreachable
    return true;
  }
}

export async function getFreeDailyAiLimit(): Promise<number> {
  const now = Date.now();
  if (cachedFreeDailyAiLimit !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedFreeDailyAiLimit;
  }

  try {
    const setting = await adminPrisma.platformSetting.findUnique({
      where: { key: "freeDailyAiLimit" },
    });
    const parsed = setting ? Number.parseInt(setting.value, 10) : Number.NaN;
    cachedFreeDailyAiLimit = Number.isNaN(parsed)
      ? DEFAULT_FREE_DAILY_AI_LIMIT
      : parsed;
    cacheTimestamp = now;
    return cachedFreeDailyAiLimit;
  } catch {
    // Fail-safe: use hardcoded default if admin DB is unreachable
    return DEFAULT_FREE_DAILY_AI_LIMIT;
  }
}

export function clearSettingsCache() {
  cachedSignupEnabled = null;
  cachedFreeDailyAiLimit = null;
  cacheTimestamp = 0;
}
