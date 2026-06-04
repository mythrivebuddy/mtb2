/*
  Warnings:

  - The values [HYBRID] on the enum `HostedEventFormat` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."HostedEventFormat_new" AS ENUM ('IN_PERSON', 'ONLINE');
ALTER TABLE "public"."HostedEvent" ALTER COLUMN "format" TYPE "public"."HostedEventFormat_new" USING ("format"::text::"public"."HostedEventFormat_new");
ALTER TYPE "public"."HostedEventFormat" RENAME TO "HostedEventFormat_old";
ALTER TYPE "public"."HostedEventFormat_new" RENAME TO "HostedEventFormat";
DROP TYPE "public"."HostedEventFormat_old";
COMMIT;
