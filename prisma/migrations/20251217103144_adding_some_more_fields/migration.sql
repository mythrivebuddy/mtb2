/*
  Warnings:

  - You are about to drop the column `amount` on the `PaymentOrder` table. All the data in the column will be lost.
  - Added the required column `baseAmount` to the `PaymentOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `PaymentOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."PaymentOrder" DROP COLUMN "amount",
ADD COLUMN     "baseAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "discountApplied" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL;
