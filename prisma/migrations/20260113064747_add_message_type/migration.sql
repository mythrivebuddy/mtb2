-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('USER', 'SYSTEM');

-- AlterTable
ALTER TABLE "public"."challenge_messages" ADD COLUMN     "type" "public"."MessageType" NOT NULL DEFAULT 'USER';
