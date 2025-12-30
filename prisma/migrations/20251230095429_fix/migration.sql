/*
  Warnings:

  - You are about to drop the column `isFinal` on the `UserMakeoverCommitment` table. All the data in the column will be lost.
  - You are about to drop the column `visionImageUrl` on the `UserMakeoverCommitment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."UserMakeoverCommitment" DROP COLUMN "isFinal",
DROP COLUMN "visionImageUrl";
