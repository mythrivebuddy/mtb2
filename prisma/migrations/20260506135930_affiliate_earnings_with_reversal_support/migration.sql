-- AlterEnum
ALTER TYPE "public"."EarningStatus" ADD VALUE 'REFUNDED';

-- CreateTable
CREATE TABLE "public"."AffiliateEarningLedger" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "contextType" "public"."PaymentContextType" NOT NULL,
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "earnedAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "commissionType" "public"."AffiliateCommissionType" NOT NULL,
    "reversalOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."EarningStatus" NOT NULL DEFAULT 'PENDING',
    "payoutId" TEXT,

    CONSTRAINT "AffiliateEarningLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AffiliatePayout" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "public"."PayoutStatus" NOT NULL DEFAULT 'PAID',
    "referenceId" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliatePayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AffiliateEarningLedger_affiliateId_status_idx" ON "public"."AffiliateEarningLedger"("affiliateId", "status");

-- CreateIndex
CREATE INDEX "AffiliateEarningLedger_paymentOrderId_idx" ON "public"."AffiliateEarningLedger"("paymentOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateEarningLedger_paymentOrderId_affiliateId_contextId_key" ON "public"."AffiliateEarningLedger"("paymentOrderId", "affiliateId", "contextId", "contextType", "reversalOfId");

-- CreateIndex
CREATE INDEX "AffiliatePayout_affiliateId_idx" ON "public"."AffiliatePayout"("affiliateId");

-- AddForeignKey
ALTER TABLE "public"."AffiliateEarningLedger" ADD CONSTRAINT "AffiliateEarningLedger_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AffiliateEarningLedger" ADD CONSTRAINT "AffiliateEarningLedger_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AffiliateEarningLedger" ADD CONSTRAINT "AffiliateEarningLedger_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "public"."PaymentOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AffiliateEarningLedger" ADD CONSTRAINT "AffiliateEarningLedger_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "public"."AffiliateEarningLedger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AffiliateEarningLedger" ADD CONSTRAINT "AffiliateEarningLedger_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "public"."AffiliatePayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AffiliatePayout" ADD CONSTRAINT "AffiliatePayout_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
