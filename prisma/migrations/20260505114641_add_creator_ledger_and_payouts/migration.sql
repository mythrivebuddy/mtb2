-- CreateEnum
CREATE TYPE "public"."EarningStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "public"."CreatorEarningLedger" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "contextType" "public"."PaymentContextType" NOT NULL,
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "earnedAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "public"."EarningStatus" NOT NULL DEFAULT 'PENDING',
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorEarningLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreatorPayout" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "public"."PayoutStatus" NOT NULL DEFAULT 'PAID',
    "referenceId" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorEarningLedger_creatorId_status_idx" ON "public"."CreatorEarningLedger"("creatorId", "status");

-- CreateIndex
CREATE INDEX "CreatorEarningLedger_paymentOrderId_idx" ON "public"."CreatorEarningLedger"("paymentOrderId");

-- CreateIndex
CREATE INDEX "CreatorEarningLedger_creatorId_idx" ON "public"."CreatorEarningLedger"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorEarningLedger_paymentOrderId_contextId_contextType_c_key" ON "public"."CreatorEarningLedger"("paymentOrderId", "contextId", "contextType", "currency");

-- CreateIndex
CREATE INDEX "CreatorPayout_creatorId_idx" ON "public"."CreatorPayout"("creatorId");

-- AddForeignKey
ALTER TABLE "public"."CreatorEarningLedger" ADD CONSTRAINT "CreatorEarningLedger_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreatorEarningLedger" ADD CONSTRAINT "CreatorEarningLedger_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "public"."PaymentOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreatorEarningLedger" ADD CONSTRAINT "CreatorEarningLedger_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "public"."CreatorPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreatorPayout" ADD CONSTRAINT "CreatorPayout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
