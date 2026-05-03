import { PrismaClient } from ".prisma/admin-client";
import { DEFAULT_FREE_DAILY_AI_LIMIT } from "@snap-cals/shared";
import bcrypt from "bcryptjs";

const adminPrisma = new PrismaClient();

async function main() {
  const email = "admin@snapcals.com";
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await adminPrisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Admin",
      passwordHash,
    },
  });

  console.log(`Admin seeded: ${admin.email}`);

  await adminPrisma.platformSetting.upsert({
    where: { key: "signupEnabled" },
    update: {},
    create: { key: "signupEnabled", value: "true" },
  });

  await adminPrisma.platformSetting.upsert({
    where: { key: "freeDailyAiLimit" },
    update: {},
    create: {
      key: "freeDailyAiLimit",
      value: String(DEFAULT_FREE_DAILY_AI_LIMIT),
    },
  });

  console.log("Platform settings seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => adminPrisma.$disconnect());
