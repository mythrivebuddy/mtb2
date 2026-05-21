-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationType" ADD VALUE 'STORE_PURCHASE';
ALTER TYPE "public"."NotificationType" ADD VALUE 'STORE_SALE';
ALTER TYPE "public"."NotificationType" ADD VALUE 'MMP_JOINED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'MMP_ENROLLMENT_CREATOR';
ALTER TYPE "public"."NotificationType" ADD VALUE 'MMP_ENROLLMENT_ADMIN';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CHALLENGE_JOINED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CHALLENGE_ENROLLMENT_CREATOR';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CHALLENGE_ENROLLMENT_ADMIN';
ALTER TYPE "public"."NotificationType" ADD VALUE 'STORE_ORDER_ADMIN';
