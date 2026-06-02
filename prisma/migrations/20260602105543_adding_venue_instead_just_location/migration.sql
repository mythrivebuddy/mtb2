/*
  Warnings:

  - You are about to drop the column `location` on the `HostedEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."HostedEvent" DROP COLUMN "location",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "travelInstructions" TEXT,
ADD COLUMN     "venueName" TEXT;
