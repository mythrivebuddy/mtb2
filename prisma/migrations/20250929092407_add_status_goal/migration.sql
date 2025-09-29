/*
  Warnings:

  - Added the required column `status` to the `Goal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Goal" ADD COLUMN     "status" TEXT NOT NULL;
