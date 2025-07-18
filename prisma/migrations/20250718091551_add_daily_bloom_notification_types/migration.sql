/*
  Warnings:

  - The values [DAILY_BLOOM_CREATION,DAILY_BLOOM_COMPLETION] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('JP_EARNED', 'PROSPERITY_APPLIED', 'SPOTLIGHT_APPROVED', 'SPOTLIGHT_ACTIVE', 'MAGIC_BOX_SHARED', 'SPOTLIGHT_APPLIED', 'PROSPERITY_APPROVED', 'BUDDY_LENS_CLAIMED', 'BUDDY_LENS_APPROVED', 'BUDDY_LENS_REJECTED', 'BUDDY_LENS_REVIEWED', 'BUDDY_LENS_COMPLETED');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;
