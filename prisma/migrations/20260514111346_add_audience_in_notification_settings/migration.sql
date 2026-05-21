-- CreateEnum
CREATE TYPE "public"."NotificationAudience" AS ENUM ('COACH', 'ADMIN', 'USER');

-- AlterTable
ALTER TABLE "public"."NotificationSettings" ADD COLUMN     "audiences" "public"."NotificationAudience"[];
