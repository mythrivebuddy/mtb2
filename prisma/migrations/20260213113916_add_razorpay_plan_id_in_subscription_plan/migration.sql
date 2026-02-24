/*
  Warnings:

  - A unique constraint covering the columns `[razorpayPlanId]` on the table `SubscriptionPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."SubscriptionPlan" ADD COLUMN     "razorpayPlanId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_razorpayPlanId_key" ON "public"."SubscriptionPlan"("razorpayPlanId");
