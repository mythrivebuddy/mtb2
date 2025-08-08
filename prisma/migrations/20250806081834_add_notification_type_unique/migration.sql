/*
  Warnings:

  - A unique constraint covering the columns `[notification_type]` on the table `NotificationSettings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_notification_type_key" ON "public"."NotificationSettings"("notification_type");
