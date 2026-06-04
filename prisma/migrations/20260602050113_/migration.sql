/*
  Warnings:

  - You are about to drop the column `expiryDate` on the `HostedEventTicket` table. All the data in the column will be lost.
  - You are about to drop the column `includeTax` on the `HostedEventTicket` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `HostedEventTicket` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."HostedEventTicket_eventId_name_key";

-- AlterTable
ALTER TABLE "public"."HostedEventTicket" DROP COLUMN "expiryDate",
DROP COLUMN "includeTax",
DROP COLUMN "name";
