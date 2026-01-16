/*
  Warnings:

  - A unique constraint covering the columns `[userId,programId,sundayCardId,date]` on the table `SundayProgressLog` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sundayCardId` to the `SundayProgressLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."SundayProgressLog_userId_programId_date_key";

-- AlterTable
ALTER TABLE "public"."SundayProgressLog" ADD COLUMN     "sundayCardId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SundayProgressLog_userId_programId_sundayCardId_date_key" ON "public"."SundayProgressLog"("userId", "programId", "sundayCardId", "date");
