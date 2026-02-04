-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationType" ADD VALUE 'CMP_DAILY_PRIMARY';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CMP_DAILY_GENTLE_NUDGE';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CMP_SUNDAY_MORNING';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CMP_SUNDAY_EVENING_PENDING';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CMP_QUARTER_ENDING_SOON';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CMP_QUARTER_RESET';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CMP_REWARD_UNLOCKED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CMP_REWARD_UNCLAIMED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CMP_LEVEL_UP';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CMP_GOA_PROGRESS_MILESTONE';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CMP_GOA_ELIGIBLE';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CMP_INACTIVITY_3_DAYS';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CMP_INACTIVITY_7_DAYS';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CMP_ONBOARDING_PENDING';
