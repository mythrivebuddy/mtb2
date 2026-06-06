-- AlterTable
ALTER TABLE "public"."PaymentOrder" ADD COLUMN     "hostedEventId" TEXT;

-- CreateIndex
CREATE INDEX "PaymentOrder_hostedEventId_idx" ON "public"."PaymentOrder"("hostedEventId");

-- AddForeignKey
ALTER TABLE "public"."PaymentOrder" ADD CONSTRAINT "PaymentOrder_hostedEventId_fkey" FOREIGN KEY ("hostedEventId") REFERENCES "public"."HostedEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
