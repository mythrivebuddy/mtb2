-- CreateEnum
CREATE TYPE "public"."CouponCreatorType" AS ENUM ('COACH', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."CouponScope" AS ENUM ('SUBSCRIPTION', 'CHALLENGE', 'STORE_PRODUCT');

-- AlterTable
ALTER TABLE "public"."Coupon" ADD COLUMN     "challengeCreatorType" "public"."CouponCreatorType",
ADD COLUMN     "creatorUserId" TEXT,
ADD COLUMN     "scope" "public"."CouponScope" NOT NULL DEFAULT 'SUBSCRIPTION';

-- CreateTable
CREATE TABLE "public"."_ChallengeCoupons" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ChallengeCoupons_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ChallengeCoupons_B_index" ON "public"."_ChallengeCoupons"("B");

-- CreateIndex
CREATE INDEX "Coupon_couponCode_idx" ON "public"."Coupon"("couponCode");

-- CreateIndex
CREATE INDEX "Coupon_scope_idx" ON "public"."Coupon"("scope");

-- CreateIndex
CREATE INDEX "Coupon_status_idx" ON "public"."Coupon"("status");

-- AddForeignKey
ALTER TABLE "public"."_ChallengeCoupons" ADD CONSTRAINT "_ChallengeCoupons_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ChallengeCoupons" ADD CONSTRAINT "_ChallengeCoupons_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
