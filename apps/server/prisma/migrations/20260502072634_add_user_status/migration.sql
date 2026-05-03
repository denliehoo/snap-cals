-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('VERIFIED', 'UNVERIFIED', 'DEACTIVATED');

-- AlterTable: add status column with default
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'UNVERIFIED';

-- Migrate data: convert emailVerified to status
UPDATE "User" SET "status" = 'VERIFIED' WHERE "emailVerified" = true;
UPDATE "User" SET "status" = 'UNVERIFIED' WHERE "emailVerified" = false;

-- Drop old column
ALTER TABLE "User" DROP COLUMN "emailVerified";
