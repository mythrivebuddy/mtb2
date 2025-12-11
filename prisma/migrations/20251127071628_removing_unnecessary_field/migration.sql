/*
  Warnings:

  - You are about to drop the column `creatorSignatureText` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `creatorSignatureUrl` on the `challenges` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."challenges" DROP COLUMN "creatorSignatureText",
DROP COLUMN "creatorSignatureUrl";
