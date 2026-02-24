-- AlterTable
ALTER TABLE "public"."OneTimeProgramPurchase" ADD COLUMN     "razorpayReceipt" TEXT;

-- AlterTable
ALTER TABLE "public"."PaymentOrder" ADD COLUMN     "razorpayReceipt" TEXT;
