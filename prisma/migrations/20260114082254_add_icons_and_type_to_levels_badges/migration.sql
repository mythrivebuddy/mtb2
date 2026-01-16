/*
  Warnings:

  - The `type` column on the `MakeoverBadge` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."MakeoverBadgeType" AS ENUM ('LEVEL', 'MILESTONE');

-- AlterTable
ALTER TABLE "public"."MakeoverBadge" ADD COLUMN     "icon" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "public"."MakeoverBadgeType";

-- AlterTable
ALTER TABLE "public"."MakeoverLevel" ADD COLUMN     "icon" TEXT;
