-- CreateTable
CREATE TABLE "public"."MakeoverArea" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "MakeoverArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MakeoverAreaChallengeMap" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "challengeId" TEXT NOT NULL,

    CONSTRAINT "MakeoverAreaChallengeMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserMakeoverArea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "UserMakeoverArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MakeoverGoalLibrary" (
    "id" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MakeoverGoalLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MakeoverIdentityLibrary" (
    "id" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "statement" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MakeoverIdentityLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MakeoverDailyActionLibrary" (
    "id" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MakeoverDailyActionLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserMakeoverCommitment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "quarter" TEXT NOT NULL,
    "goalId" TEXT,
    "goalText" TEXT,
    "identityId" TEXT,
    "identityText" TEXT,
    "actionId" TEXT,
    "actionText" TEXT,

    CONSTRAINT "UserMakeoverCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MakeoverProgressLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "identityDone" BOOLEAN,
    "actionDone" BOOLEAN,
    "winLogged" BOOLEAN,
    "weeklyWin" TEXT,
    "identityShift" TEXT,
    "nextWeekFocus" TEXT,
    "sharedInGroup" BOOLEAN NOT NULL DEFAULT false,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MakeoverProgressLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MakeoverCompletionSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "completionPercentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MakeoverCompletionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MakeoverPointsSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MakeoverPointsSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MakeoverLevel" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "minPoints" INTEGER NOT NULL,

    CONSTRAINT "MakeoverLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserMakeoverLevel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "levelId" INTEGER NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMakeoverLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MakeoverBadge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "thresholdPoints" INTEGER,

    CONSTRAINT "MakeoverBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserMakeoverBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMakeoverBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MakeoverAccountabilityBuddy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "buddyUserId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "quarter" TEXT NOT NULL,

    CONSTRAINT "MakeoverAccountabilityBuddy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserMakeoverChallengeEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "challengeId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,

    CONSTRAINT "UserMakeoverChallengeEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverArea_name_key" ON "public"."MakeoverArea"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverAreaChallengeMap_programId_areaId_key" ON "public"."MakeoverAreaChallengeMap"("programId", "areaId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMakeoverArea_userId_programId_areaId_key" ON "public"."UserMakeoverArea"("userId", "programId", "areaId");

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverGoalLibrary_areaId_title_key" ON "public"."MakeoverGoalLibrary"("areaId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverIdentityLibrary_areaId_statement_key" ON "public"."MakeoverIdentityLibrary"("areaId", "statement");

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverDailyActionLibrary_areaId_title_key" ON "public"."MakeoverDailyActionLibrary"("areaId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "UserMakeoverCommitment_userId_programId_areaId_quarter_key" ON "public"."UserMakeoverCommitment"("userId", "programId", "areaId", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverProgressLog_userId_programId_areaId_date_key" ON "public"."MakeoverProgressLog"("userId", "programId", "areaId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverCompletionSnapshot_userId_programId_areaId_month_key" ON "public"."MakeoverCompletionSnapshot"("userId", "programId", "areaId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverPointsSummary_userId_programId_areaId_key" ON "public"."MakeoverPointsSummary"("userId", "programId", "areaId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMakeoverLevel_userId_programId_key" ON "public"."UserMakeoverLevel"("userId", "programId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMakeoverBadge_userId_programId_badgeId_key" ON "public"."UserMakeoverBadge"("userId", "programId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverAccountabilityBuddy_userId_programId_areaId_quarter_key" ON "public"."MakeoverAccountabilityBuddy"("userId", "programId", "areaId", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "UserMakeoverChallengeEnrollment_userId_programId_areaId_key" ON "public"."UserMakeoverChallengeEnrollment"("userId", "programId", "areaId");

-- AddForeignKey
ALTER TABLE "public"."MakeoverAreaChallengeMap" ADD CONSTRAINT "MakeoverAreaChallengeMap_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverAreaChallengeMap" ADD CONSTRAINT "MakeoverAreaChallengeMap_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverArea" ADD CONSTRAINT "UserMakeoverArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverArea" ADD CONSTRAINT "UserMakeoverArea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverCommitment" ADD CONSTRAINT "UserMakeoverCommitment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverCommitment" ADD CONSTRAINT "UserMakeoverCommitment_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverProgressLog" ADD CONSTRAINT "MakeoverProgressLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverProgressLog" ADD CONSTRAINT "MakeoverProgressLog_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverLevel" ADD CONSTRAINT "UserMakeoverLevel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverLevel" ADD CONSTRAINT "UserMakeoverLevel_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "public"."MakeoverLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverBadge" ADD CONSTRAINT "UserMakeoverBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverBadge" ADD CONSTRAINT "UserMakeoverBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."MakeoverBadge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverAccountabilityBuddy" ADD CONSTRAINT "MakeoverAccountabilityBuddy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverAccountabilityBuddy" ADD CONSTRAINT "MakeoverAccountabilityBuddy_buddyUserId_fkey" FOREIGN KEY ("buddyUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverChallengeEnrollment" ADD CONSTRAINT "UserMakeoverChallengeEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverChallengeEnrollment" ADD CONSTRAINT "UserMakeoverChallengeEnrollment_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverChallengeEnrollment" ADD CONSTRAINT "UserMakeoverChallengeEnrollment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."challenge_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
