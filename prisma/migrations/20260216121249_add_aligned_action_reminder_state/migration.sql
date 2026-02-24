-- AlterTable
ALTER TABLE "public"."AlignedAction" ADD COLUMN     "activeReminder" TEXT,
ADD COLUMN     "popupShown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderAt" TIMESTAMP(3);
