-- CreateEnum
CREATE TYPE "ChallengeMode" AS ENUM ('PUBLIC', 'PERSONAL');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mode" "ChallengeMode" NOT NULL DEFAULT 'PUBLIC',
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "penalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_tasks" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "challengeId" TEXT NOT NULL,

    CONSTRAINT "challenge_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_enrollments" (
    "id" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,

    CONSTRAINT "challenge_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "challenges_slug_key" ON "challenges"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_enrollments_userId_challengeId_key" ON "challenge_enrollments"("userId", "challengeId");

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_tasks" ADD CONSTRAINT "challenge_tasks_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_enrollments" ADD CONSTRAINT "challenge_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_enrollments" ADD CONSTRAINT "challenge_enrollments_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
