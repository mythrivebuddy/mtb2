-- AlterTable
ALTER TABLE "public"."PaymentOrder" ADD COLUMN     "invoiceSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "invoiceSentAt" TIMESTAMP(3);
