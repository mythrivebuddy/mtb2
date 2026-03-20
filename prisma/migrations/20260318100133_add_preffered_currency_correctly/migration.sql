/*
  Warnings:

  - You are about to drop the column `PreferredCurrency` on the `UserBusinessProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."UserBusinessProfile" DROP COLUMN "PreferredCurrency",
ADD COLUMN     "preferredCurrency" TEXT;
