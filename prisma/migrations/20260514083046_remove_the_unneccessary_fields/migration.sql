/*
  Warnings:

  - You are about to drop the column `country` on the `UserFinancialDetails` table. All the data in the column will be lost.
  - You are about to drop the column `gstNumber` on the `UserFinancialDetails` table. All the data in the column will be lost.
  - You are about to drop the column `isGstRegistered` on the `UserFinancialDetails` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."UserFinancialDetails_country_idx";

-- AlterTable
ALTER TABLE "public"."UserFinancialDetails" DROP COLUMN "country",
DROP COLUMN "gstNumber",
DROP COLUMN "isGstRegistered";
