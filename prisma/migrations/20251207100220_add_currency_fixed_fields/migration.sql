/*
  Warnings:

  - You are about to drop the column `discountAmount` on the `Coupon` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Coupon" DROP COLUMN "discountAmount",
ADD COLUMN     "discountAmountINR" DOUBLE PRECISION,
ADD COLUMN     "discountAmountUSD" DOUBLE PRECISION;
