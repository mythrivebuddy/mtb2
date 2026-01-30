/*
  Warnings:

  - Made the column `lastUpdated` on table `MakeoverPointsSummary` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."MakeoverPointsSummary" ALTER COLUMN "lastUpdated" SET NOT NULL;
