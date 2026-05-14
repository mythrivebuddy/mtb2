-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationType" ADD VALUE 'ALIGNED_ACTION_START';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ALIGNED_ACTION_END';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ACCOUNTABILITY_NUDGE';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ACCOUNTABILITY_MEMBER_ADDED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CHALLENGE_CHAT_MESSAGE';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CHALLENGE_PENALTY';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CHALLENGE_NEW_PARTICIPANT';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ACCOUNTABILITY_NOTES_UPDATED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ACCOUNTABILITY_COMMENT_ON_GOAL';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ACCOUNTABILITY_COMMENT_MENTION';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ACCOUNTABILITY_COMMENT_REPLY';
