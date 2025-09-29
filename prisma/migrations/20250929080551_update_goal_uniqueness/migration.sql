/*
  Warnings:

  - A unique constraint covering the columns `[authorId,cycleId]` on the table `Goal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cycleId` to the `Goal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Goal" ADD COLUMN     "cycleId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Goal_authorId_cycleId_key" ON "public"."Goal"("authorId", "cycleId");
