-- AlterTable
ALTER TABLE "public"."OrderItem" ADD COLUMN     "originalCurrency" TEXT DEFAULT 'INR',
ADD COLUMN     "originalPrice" DOUBLE PRECISION DEFAULT 0;
