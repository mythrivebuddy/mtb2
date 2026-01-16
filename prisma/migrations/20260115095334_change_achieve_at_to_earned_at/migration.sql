/*
  Warnings:

  - You are about to drop the column `achievedAt` on the `UserMakeoverLevel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."UserMakeoverLevel" DROP COLUMN "achievedAt",
ADD COLUMN     "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
