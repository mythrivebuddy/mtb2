-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "affiliateEnabledAt" TIMESTAMP(3),
ADD COLUMN     "affiliatePercent" DOUBLE PRECISION,
ADD COLUMN     "isAffiliate" BOOLEAN NOT NULL DEFAULT false;
