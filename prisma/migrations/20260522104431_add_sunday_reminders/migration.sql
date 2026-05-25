-- AlterTable
ALTER TABLE "public"."UserProgramState" ADD COLUMN     "lastSundayEveningReminderAt" TIMESTAMP(3),
ADD COLUMN     "lastSundayMorningReminderAt" TIMESTAMP(3);
