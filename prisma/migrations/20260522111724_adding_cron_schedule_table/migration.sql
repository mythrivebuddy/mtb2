-- CreateEnum
CREATE TYPE "public"."CronKey" AS ENUM ('CMP_PRIMARY_REMINDER', 'CMP_NUDGE_REMINDER', 'CMP_SUNDAY_MORNING', 'CMP_SUNDAY_EVENING', 'DAILY_CHALLENGE_PENALTY', 'CMP_INACTIVITY_7_DAY', 'CMP_INACTIVITY_3_DAY', 'DAILY_CHALLENGE_REMINDER');

-- CreateTable
CREATE TABLE "public"."CronSchedule" (
    "id" TEXT NOT NULL,
    "key" "public"."CronKey" NOT NULL,
    "hour" INTEGER NOT NULL,
    "minute" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CronSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CronSchedule_key_key" ON "public"."CronSchedule"("key");
