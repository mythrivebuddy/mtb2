-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationType" ADD VALUE 'SUBSCRIPTION_ACTIVATED_USER';
ALTER TYPE "public"."NotificationType" ADD VALUE 'SUBSCRIPTION_RENEWED_USER';
ALTER TYPE "public"."NotificationType" ADD VALUE 'SUBSCRIPTION_PURCHASED_ADMIN';
ALTER TYPE "public"."NotificationType" ADD VALUE 'SUBSCRIPTION_RENEWED_ADMIN';
