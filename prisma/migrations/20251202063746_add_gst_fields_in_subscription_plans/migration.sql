-- AlterTable
ALTER TABLE "public"."SubscriptionPlan" ADD COLUMN     "gstEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "gstPercentage" DOUBLE PRECISION NOT NULL DEFAULT 18;
