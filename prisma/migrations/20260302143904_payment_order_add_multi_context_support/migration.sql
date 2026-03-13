-- CreateEnum
CREATE TYPE "public"."PaymentContextType" AS ENUM ('SUBSCRIPTION', 'CHALLENGE', 'STORE_ORDER');

-- DropForeignKey
ALTER TABLE "public"."PaymentOrder" DROP CONSTRAINT "PaymentOrder_planId_fkey";

-- AlterTable
ALTER TABLE "public"."PaymentOrder" ADD COLUMN     "challengeId" TEXT,
ADD COLUMN     "contextType" "public"."PaymentContextType",
ADD COLUMN     "storeOrderId" TEXT,
ALTER COLUMN "planId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PaymentOrder_planId_idx" ON "public"."PaymentOrder"("planId");

-- CreateIndex
CREATE INDEX "PaymentOrder_challengeId_idx" ON "public"."PaymentOrder"("challengeId");

-- CreateIndex
CREATE INDEX "PaymentOrder_storeOrderId_idx" ON "public"."PaymentOrder"("storeOrderId");

-- CreateIndex
CREATE INDEX "PaymentOrder_contextType_idx" ON "public"."PaymentOrder"("contextType");

-- AddForeignKey
ALTER TABLE "public"."PaymentOrder" ADD CONSTRAINT "PaymentOrder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentOrder" ADD CONSTRAINT "PaymentOrder_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."challenges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentOrder" ADD CONSTRAINT "PaymentOrder_storeOrderId_fkey" FOREIGN KEY ("storeOrderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
