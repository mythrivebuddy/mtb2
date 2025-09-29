-- CreateEnum
CREATE TYPE "public"."GroupRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "public"."GroupMember" ADD COLUMN     "role" "public"."GroupRole" NOT NULL DEFAULT 'MEMBER';
