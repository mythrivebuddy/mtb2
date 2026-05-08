-- CreateEnum
CREATE TYPE "public"."AffiliateCommissionType" AS ENUM ('MTB', 'SUBSCRIPTION');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "affiliateCommissionType" "public"."AffiliateCommissionType";
