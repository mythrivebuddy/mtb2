/*
  Warnings:

  - You are about to drop the column `email` on the `UserBillingInformation` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `UserBillingInformation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."UserBillingInformation" DROP COLUMN "email",
DROP COLUMN "fullName";
