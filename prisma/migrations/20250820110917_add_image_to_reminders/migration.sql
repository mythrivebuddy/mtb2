/*
  Warnings:

  - Added the required column `image` to the `Reminder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Reminder" ADD COLUMN     "image" TEXT NOT NULL;
