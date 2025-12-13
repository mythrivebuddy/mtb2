-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PAID', 'PENDING', 'FAILED');

-- AlterEnum
ALTER TYPE "public"."PlanInterval" ADD VALUE 'ONE_TIME';

-- AlterEnum
ALTER TYPE "public"."SubscriptionStatus" ADD VALUE 'FREE_GRANT';

-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "grantedByPurchaseId" TEXT;

-- AlterTable
ALTER TABLE "public"."SubscriptionPlan" ADD COLUMN     "isProgramPlan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "programId" TEXT;

-- CreateTable
CREATE TABLE "public"."Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER,
    "isOneTimeProduct" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "grantsFreeSubscriptionToPlanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OneTimeProgramPurchase" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "cashfreeOrderId" TEXT,
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountApplied" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "couponId" TEXT,
    "status" "public"."PaymentStatus" NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "freeSubscriptionId" TEXT,

    CONSTRAINT "OneTimeProgramPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Program_name_key" ON "public"."Program"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Program_slug_key" ON "public"."Program"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OneTimeProgramPurchase_freeSubscriptionId_key" ON "public"."OneTimeProgramPurchase"("freeSubscriptionId");

-- AddForeignKey
ALTER TABLE "public"."SubscriptionPlan" ADD CONSTRAINT "SubscriptionPlan_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OneTimeProgramPurchase" ADD CONSTRAINT "OneTimeProgramPurchase_freeSubscriptionId_fkey" FOREIGN KEY ("freeSubscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OneTimeProgramPurchase" ADD CONSTRAINT "OneTimeProgramPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OneTimeProgramPurchase" ADD CONSTRAINT "OneTimeProgramPurchase_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OneTimeProgramPurchase" ADD CONSTRAINT "OneTimeProgramPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OneTimeProgramPurchase" ADD CONSTRAINT "OneTimeProgramPurchase_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "public"."Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
