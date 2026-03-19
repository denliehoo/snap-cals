-- DropForeignKey
ALTER TABLE "FoodEntry" DROP CONSTRAINT IF EXISTS "FoodEntry_favoriteId_fkey";

-- AlterTable
ALTER TABLE "FoodEntry" DROP COLUMN IF EXISTS "favoriteId";
