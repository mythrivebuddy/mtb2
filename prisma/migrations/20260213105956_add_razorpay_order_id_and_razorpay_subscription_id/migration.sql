-- AlterTable
ALTER TABLE "public"."OneTimeProgramPurchase" ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpaySubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "public"."PaymentOrder" ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpaySubscriptionId" TEXT;
