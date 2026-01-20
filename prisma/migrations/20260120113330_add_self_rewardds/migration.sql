-- CreateTable
CREATE TABLE "public"."MakeoverSelfRewardLibrary" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "levelId" INTEGER NOT NULL,
    "levelName" TEXT NOT NULL,
    "minPoints" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MakeoverSelfRewardLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MakeoverSelfRewardCheckpoint" (
    "id" TEXT NOT NULL,
    "levelId" INTEGER NOT NULL,
    "minPoints" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MakeoverSelfRewardCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserMakeoverSelfReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "levelId" INTEGER NOT NULL,
    "levelName" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "rewardId" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "customTitle" TEXT,
    "customDescription" TEXT,
    "pointsAtUnlock" INTEGER NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMakeoverSelfReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MakeoverSelfRewardCheckpoint_levelId_idx" ON "public"."MakeoverSelfRewardCheckpoint"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverSelfRewardCheckpoint_levelId_minPoints_key" ON "public"."MakeoverSelfRewardCheckpoint"("levelId", "minPoints");

-- CreateIndex
CREATE INDEX "UserMakeoverSelfReward_userId_programId_levelId_idx" ON "public"."UserMakeoverSelfReward"("userId", "programId", "levelId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMakeoverSelfReward_userId_programId_checkpointId_key" ON "public"."UserMakeoverSelfReward"("userId", "programId", "checkpointId");

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverSelfReward" ADD CONSTRAINT "UserMakeoverSelfReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
