/*
  Warnings:

  - You are about to drop the column `message` on the `Nudge` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Nudge` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Nudge" DROP COLUMN "message",
DROP COLUMN "userId";
