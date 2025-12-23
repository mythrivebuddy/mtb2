/*
  Warnings:

  - A unique constraint covering the columns `[areaId,title]` on the table `MakeoverDailyActionLibrary` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[areaId,title]` on the table `MakeoverGoalLibrary` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[areaId,statement]` on the table `MakeoverIdentityLibrary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MakeoverDailyActionLibrary_areaId_title_key" ON "public"."MakeoverDailyActionLibrary"("areaId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverGoalLibrary_areaId_title_key" ON "public"."MakeoverGoalLibrary"("areaId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverIdentityLibrary_areaId_statement_key" ON "public"."MakeoverIdentityLibrary"("areaId", "statement");
