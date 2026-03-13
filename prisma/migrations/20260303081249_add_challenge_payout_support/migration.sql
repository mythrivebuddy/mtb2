-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."ChallengePayout" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "netPayable" DOUBLE PRECISION NOT NULL,
    "status" "public"."PayoutStatus" NOT NULL,
    "processedByAdminId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengePayout_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ChallengePayout" ADD CONSTRAINT "ChallengePayout_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengePayout" ADD CONSTRAINT "ChallengePayout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
