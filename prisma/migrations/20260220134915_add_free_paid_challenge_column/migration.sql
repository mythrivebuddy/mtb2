-- CreateEnum
CREATE TYPE "public"."ChallengeJoiningType" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "public"."challengeJoiningFeeCurrency" AS ENUM ('INR', 'USD');

-- AlterTable
ALTER TABLE "public"."challenges" ADD COLUMN     "challengeJoiningFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "challengeJoiningFeeCurrency" "public"."challengeJoiningFeeCurrency" NOT NULL DEFAULT 'INR',
ADD COLUMN     "challengeJoiningType" "public"."ChallengeJoiningType" NOT NULL DEFAULT 'FREE';
