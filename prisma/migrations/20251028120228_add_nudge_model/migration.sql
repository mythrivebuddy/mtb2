/*
  Warnings:

  - The values [WEEKLY,BIWEEKLY] on the enum `CycleDuration` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."CycleDuration_new" AS ENUM ('MONTHLY', 'QUARTERLY', 'CUSTOM');
ALTER TABLE "public"."Group" ALTER COLUMN "cycleDuration" DROP DEFAULT;
ALTER TABLE "public"."Group" ALTER COLUMN "cycleDuration" TYPE "public"."CycleDuration_new" USING ("cycleDuration"::text::"public"."CycleDuration_new");
ALTER TYPE "public"."CycleDuration" RENAME TO "CycleDuration_old";
ALTER TYPE "public"."CycleDuration_new" RENAME TO "CycleDuration";
DROP TYPE "public"."CycleDuration_old";
ALTER TABLE "public"."Group" ALTER COLUMN "cycleDuration" SET DEFAULT 'MONTHLY';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Group" ALTER COLUMN "cycleDuration" SET DEFAULT 'MONTHLY';
