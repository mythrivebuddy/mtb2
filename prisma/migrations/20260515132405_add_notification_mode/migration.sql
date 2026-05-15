-- CreateEnum
CREATE TYPE "public"."NotificationMode" AS ENUM ('ALL_ON', 'ALL_OFF');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "notificationMode" "public"."NotificationMode" NOT NULL DEFAULT 'ALL_ON';
