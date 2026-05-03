import { MealType, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create a test user
  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      passwordHash,
      status: "VERIFIED",
    },
  });

  // Create goals for the user
  await prisma.goal.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      dailyCalories: 2000,
      dailyProtein: 150,
      dailyCarbs: 250,
      dailyFat: 65,
    },
  });

  // Create sample food entries for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entries = [
    {
      name: "Oatmeal with Banana",
      calories: 350,
      protein: 12,
      carbs: 58,
      fat: 8,
      servingSize: "1 bowl",
      mealType: MealType.BREAKFAST,
    },
    {
      name: "Grilled Chicken Salad",
      calories: 450,
      protein: 40,
      carbs: 20,
      fat: 22,
      servingSize: "1 plate",
      mealType: MealType.LUNCH,
    },
    {
      name: "Protein Shake",
      calories: 200,
      protein: 30,
      carbs: 10,
      fat: 5,
      servingSize: "1 scoop",
      mealType: MealType.SNACK,
    },
    {
      name: "Salmon with Rice",
      calories: 600,
      protein: 42,
      carbs: 55,
      fat: 18,
      servingSize: "1 plate",
      mealType: MealType.DINNER,
    },
  ];

  for (const entry of entries) {
    await prisma.foodEntry.create({
      data: { ...entry, userId: user.id, date: today },
    });
  }

  console.log("Seed complete: 1 user, 1 goal, 4 food entries");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
