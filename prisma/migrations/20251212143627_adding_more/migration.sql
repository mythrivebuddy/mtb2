/*
  Warnings:

  - A unique constraint covering the columns `[grantedByPurchaseId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."OneTimeProgramPurchase" DROP CONSTRAINT "OneTimeProgramPurchase_freeSubscriptionId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_grantedByPurchaseId_key" ON "public"."Subscription"("grantedByPurchaseId");

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_grantedByPurchaseId_fkey" FOREIGN KEY ("grantedByPurchaseId") REFERENCES "public"."OneTimeProgramPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
