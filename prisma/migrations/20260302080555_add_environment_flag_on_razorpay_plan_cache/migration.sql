/*
  Warnings:

  - A unique constraint covering the columns `[amount,currency,interval,intervalCount,environment]` on the table `RazorpayPlanCache` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."RazorpayPlanCache" ADD COLUMN     "environment" TEXT NOT NULL DEFAULT 'test';

-- CreateIndex
CREATE UNIQUE INDEX "RazorpayPlanCache_amount_currency_interval_intervalCount_en_key" ON "public"."RazorpayPlanCache"("amount", "currency", "interval", "intervalCount", "environment");
