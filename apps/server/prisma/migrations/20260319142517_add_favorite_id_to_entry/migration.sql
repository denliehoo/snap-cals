-- AlterTable
ALTER TABLE "FoodEntry" ADD COLUMN     "favoriteId" TEXT;

-- AddForeignKey
ALTER TABLE "FoodEntry" ADD CONSTRAINT "FoodEntry_favoriteId_fkey" FOREIGN KEY ("favoriteId") REFERENCES "FavoriteFood"("id") ON DELETE SET NULL ON UPDATE CASCADE;
