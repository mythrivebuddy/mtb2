-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('GOOGLE', 'CREDENTIALS');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('SIGNUP', 'DAILY_LOGIN', 'QUIZ_CORRECT', 'ADD_LOG', 'SPOTLIGHT', 'PROSPERITY_DROP', 'BUSINESSPROFILE_COMPLETE', 'MIRACLE_LOG', 'PROGRESS_VAULT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "SpotlightStatus" AS ENUM ('APPLIED', 'IN_REVIEW', 'APPROVED', 'DISAPPROVED', 'EXPIRED', 'ACTIVE');

-- CreateEnum
CREATE TYPE "ProsperityDropStatus" AS ENUM ('APPLIED', 'IN_REVIEW', 'APPROVED', 'DISAPPROVED');

-- CreateEnum
CREATE TYPE "SpotlightActivityType" AS ENUM ('VIEW', 'CONNECT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jpEarned" INTEGER NOT NULL DEFAULT 0,
    "jpSpent" INTEGER NOT NULL DEFAULT 0,
    "jpBalance" INTEGER NOT NULL DEFAULT 0,
    "jpTransaction" INTEGER NOT NULL DEFAULT 0,
    "authMethod" "AuthMethod" NOT NULL DEFAULT 'CREDENTIALS',
    "planId" TEXT,
    "planStart" TIMESTAMP(3),
    "planEnd" TIMESTAMP(3),
    "isBlocked" BOOLEAN DEFAULT false,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationTokenExpires" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "jpAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "activity" "ActivityType" NOT NULL,
    "jpAmount" INTEGER NOT NULL,
    "transactionType" "TransactionType" NOT NULL DEFAULT 'CREDIT',

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jpMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "durationDays" INTEGER,
    "price" TEXT NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spotlight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SpotlightStatus" NOT NULL DEFAULT 'APPLIED',
    "defaultDurationDays" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Spotlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT,
    "excerpt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBusinessProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "businessInfo" TEXT,
    "missionStatement" TEXT,
    "goals" TEXT,
    "keyOfferings" TEXT,
    "achievements" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "socialHandles" JSONB,
    "isSpotlightActive" BOOLEAN NOT NULL DEFAULT false,
    "featuredWorkTitle" TEXT,
    "featuredWorkDesc" TEXT,
    "featuredWorkImage" TEXT,
    "priorityContactLink" TEXT,
    "profileJpRewarded" BOOLEAN NOT NULL DEFAULT false,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedUsers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedBy" TEXT,

    CONSTRAINT "BlockedUsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProsperityDrop" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ProsperityDropStatus" NOT NULL DEFAULT 'APPLIED',

    CONSTRAINT "ProsperityDrop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotlightActivity" (
    "id" TEXT NOT NULL,
    "type" "SpotlightActivityType" NOT NULL,
    "spotlightId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotlightActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiracleLog" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "jpPointsAssigned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MiracleLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressVault" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "jpPointsAssigned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProgressVault_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_activity_key" ON "Activity"("activity");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE INDEX "Spotlight_expiresAt_idx" ON "Spotlight"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBusinessProfile_userId_key" ON "UserBusinessProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBusinessProfile_email_key" ON "UserBusinessProfile"("email");

-- CreateIndex
CREATE INDEX "UserBusinessProfile_name_businessInfo_missionStatement_goal_idx" ON "UserBusinessProfile"("name", "businessInfo", "missionStatement", "goals", "achievements", "keyOfferings");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedUsers_userId_key" ON "BlockedUsers"("userId");

-- CreateIndex
CREATE INDEX "ProsperityDrop_status_idx" ON "ProsperityDrop"("status");

-- CreateIndex
CREATE INDEX "SpotlightActivity_spotlightId_idx" ON "SpotlightActivity"("spotlightId");

-- CreateIndex
CREATE INDEX "SpotlightActivity_createdAt_idx" ON "SpotlightActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spotlight" ADD CONSTRAINT "Spotlight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBusinessProfile" ADD CONSTRAINT "UserBusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedUsers" ADD CONSTRAINT "BlockedUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProsperityDrop" ADD CONSTRAINT "ProsperityDrop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotlightActivity" ADD CONSTRAINT "SpotlightActivity_spotlightId_fkey" FOREIGN KEY ("spotlightId") REFERENCES "Spotlight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiracleLog" ADD CONSTRAINT "MiracleLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressVault" ADD CONSTRAINT "ProgressVault_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
