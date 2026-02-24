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

-- AddForeignKey
ALTER TABLE "public"."RazorpayPlanCache" ADD CONSTRAINT "RazorpayPlanCache_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
