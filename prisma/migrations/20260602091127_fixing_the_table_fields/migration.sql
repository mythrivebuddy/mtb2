/*
  Warnings:

  - You are about to drop the column `categoryId` on the `HostedEvent` table. All the data in the column will be lost.
  - You are about to drop the column `customCategory` on the `HostedEvent` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."HostedEvent" DROP CONSTRAINT "HostedEvent_categoryId_fkey";

-- DropIndex
DROP INDEX "public"."HostedEvent_categoryId_idx";

-- AlterTable
ALTER TABLE "public"."HostedEvent" DROP COLUMN "categoryId",
DROP COLUMN "customCategory",
ALTER COLUMN "format" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."HostedEventTicket" ALTER COLUMN "currency" DROP NOT NULL;
