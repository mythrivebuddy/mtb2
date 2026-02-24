/*
  Warnings:

  - A unique constraint covering the columns `[razorpayPlanId]` on the table `SubscriptionPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."PaymentOrder" ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayReceipt" TEXT,
ADD COLUMN     "razorpaySubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "razorpaySubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "public"."SubscriptionPlan" ADD COLUMN     "razorpayPlanId" TEXT;

-- CreateTable
CREATE TABLE "public"."AdminPaymentGatewayConfig" (
    "id" SERIAL NOT NULL,
    "activeGateway" TEXT NOT NULL DEFAULT 'CASHFREE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPaymentGatewayConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RazorpayPlanCache" (
    "id" TEXT NOT NULL,
    "razorpayPlanId" TEXT NOT NULL,
    "razorpayItemId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "interval" "public"."PlanInterval" NOT NULL,
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "gstEnabled" BOOLEAN NOT NULL,
    "gstPercentage" DECIMAL(5,2) NOT NULL,
    "planName" TEXT NOT NULL,
    "description" TEXT,
    "subscriptionPlanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RazorpayPlanCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RazorpayPlanCache_razorpayPlanId_key" ON "public"."RazorpayPlanCache"("razorpayPlanId");

-- CreateIndex
CREATE INDEX "RazorpayPlanCache_amount_currency_interval_idx" ON "public"."RazorpayPlanCache"("amount", "currency", "interval");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_razorpayPlanId_key" ON "public"."SubscriptionPlan"("razorpayPlanId");

-- AddForeignKey
ALTER TABLE "public"."RazorpayPlanCache" ADD CONSTRAINT "RazorpayPlanCache_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
