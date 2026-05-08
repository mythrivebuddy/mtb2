/*
  Warnings:

  - A unique constraint covering the columns `[paymentOrderId,affiliateId,contextId,contextType,currency]` on the table `AffiliateEarningLedger` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."AffiliateEarningLedger_paymentOrderId_affiliateId_contextId_key";

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateEarningLedger_paymentOrderId_affiliateId_contextId_key" ON "public"."AffiliateEarningLedger"("paymentOrderId", "affiliateId", "contextId", "contextType", "currency");
