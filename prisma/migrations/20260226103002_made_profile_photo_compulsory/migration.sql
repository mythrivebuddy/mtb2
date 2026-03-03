/*
  Warnings:

  - The `toolsFrameworks` column on the `UserBusinessProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `profilePhoto` on table `UserBusinessProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."UserBusinessProfile" ALTER COLUMN "profilePhoto" SET NOT NULL,
DROP COLUMN "toolsFrameworks",
ADD COLUMN     "toolsFrameworks" JSONB;
