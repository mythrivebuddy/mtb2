/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `MakeoverBadge` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MakeoverBadge_name_key" ON "public"."MakeoverBadge"("name");
