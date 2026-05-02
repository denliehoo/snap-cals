import adminPrisma from "../lib/admin-prisma";

const CACHE_TTL_MS = 60_000; // 60 seconds
let cachedSignupEnabled: boolean | null = null;
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

export function clearSettingsCache() {
  cachedSignupEnabled = null;
  cacheTimestamp = 0;
}
