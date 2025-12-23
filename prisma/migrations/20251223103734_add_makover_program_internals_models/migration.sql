-- CreateTable
CREATE TABLE "public"."MakeoverArea" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

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
CREATE TABLE "public"."UserMakeoverGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "goalId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,

    CONSTRAINT "UserMakeoverGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserMakeoverIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "identityId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,

    CONSTRAINT "UserMakeoverIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserMakeoverDailyAction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "actionId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,

    CONSTRAINT "UserMakeoverDailyAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MakeoverDailyExecutionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "identityDone" BOOLEAN NOT NULL DEFAULT false,
    "actionDone" BOOLEAN NOT NULL DEFAULT false,
    "winLogged" BOOLEAN NOT NULL DEFAULT false,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MakeoverDailyExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MakeoverWeeklyReflection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "weeklyWin" TEXT,
    "identityShift" TEXT,
    "sharedInGroup" BOOLEAN NOT NULL DEFAULT false,
    "nextWeekFocus" TEXT,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MakeoverWeeklyReflection_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverArea_name_key" ON "public"."MakeoverArea"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverAreaChallengeMap_programId_areaId_key" ON "public"."MakeoverAreaChallengeMap"("programId", "areaId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMakeoverArea_userId_programId_areaId_key" ON "public"."UserMakeoverArea"("userId", "programId", "areaId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMakeoverGoal_userId_programId_areaId_quarter_key" ON "public"."UserMakeoverGoal"("userId", "programId", "areaId", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "UserMakeoverIdentity_userId_programId_areaId_quarter_key" ON "public"."UserMakeoverIdentity"("userId", "programId", "areaId", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "UserMakeoverDailyAction_userId_programId_areaId_quarter_key" ON "public"."UserMakeoverDailyAction"("userId", "programId", "areaId", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverDailyExecutionLog_userId_programId_areaId_date_key" ON "public"."MakeoverDailyExecutionLog"("userId", "programId", "areaId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MakeoverWeeklyReflection_userId_programId_areaId_weekNumber_key" ON "public"."MakeoverWeeklyReflection"("userId", "programId", "areaId", "weekNumber");

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

-- AddForeignKey
ALTER TABLE "public"."MakeoverAreaChallengeMap" ADD CONSTRAINT "MakeoverAreaChallengeMap_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverAreaChallengeMap" ADD CONSTRAINT "MakeoverAreaChallengeMap_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverAreaChallengeMap" ADD CONSTRAINT "MakeoverAreaChallengeMap_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverArea" ADD CONSTRAINT "UserMakeoverArea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverArea" ADD CONSTRAINT "UserMakeoverArea_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverArea" ADD CONSTRAINT "UserMakeoverArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverGoalLibrary" ADD CONSTRAINT "MakeoverGoalLibrary_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverIdentityLibrary" ADD CONSTRAINT "MakeoverIdentityLibrary_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverDailyActionLibrary" ADD CONSTRAINT "MakeoverDailyActionLibrary_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverGoal" ADD CONSTRAINT "UserMakeoverGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverGoal" ADD CONSTRAINT "UserMakeoverGoal_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverGoal" ADD CONSTRAINT "UserMakeoverGoal_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "public"."MakeoverGoalLibrary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverIdentity" ADD CONSTRAINT "UserMakeoverIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverIdentity" ADD CONSTRAINT "UserMakeoverIdentity_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverIdentity" ADD CONSTRAINT "UserMakeoverIdentity_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "public"."MakeoverIdentityLibrary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverDailyAction" ADD CONSTRAINT "UserMakeoverDailyAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverDailyAction" ADD CONSTRAINT "UserMakeoverDailyAction_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverDailyAction" ADD CONSTRAINT "UserMakeoverDailyAction_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "public"."MakeoverDailyActionLibrary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverDailyExecutionLog" ADD CONSTRAINT "MakeoverDailyExecutionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverDailyExecutionLog" ADD CONSTRAINT "MakeoverDailyExecutionLog_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverDailyExecutionLog" ADD CONSTRAINT "MakeoverDailyExecutionLog_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverWeeklyReflection" ADD CONSTRAINT "MakeoverWeeklyReflection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverWeeklyReflection" ADD CONSTRAINT "MakeoverWeeklyReflection_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverWeeklyReflection" ADD CONSTRAINT "MakeoverWeeklyReflection_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverCompletionSnapshot" ADD CONSTRAINT "MakeoverCompletionSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverCompletionSnapshot" ADD CONSTRAINT "MakeoverCompletionSnapshot_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverCompletionSnapshot" ADD CONSTRAINT "MakeoverCompletionSnapshot_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverPointsSummary" ADD CONSTRAINT "MakeoverPointsSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverPointsSummary" ADD CONSTRAINT "MakeoverPointsSummary_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverPointsSummary" ADD CONSTRAINT "MakeoverPointsSummary_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverLevel" ADD CONSTRAINT "UserMakeoverLevel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverLevel" ADD CONSTRAINT "UserMakeoverLevel_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverLevel" ADD CONSTRAINT "UserMakeoverLevel_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "public"."MakeoverLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverBadge" ADD CONSTRAINT "UserMakeoverBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverBadge" ADD CONSTRAINT "UserMakeoverBadge_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMakeoverBadge" ADD CONSTRAINT "UserMakeoverBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."MakeoverBadge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverAccountabilityBuddy" ADD CONSTRAINT "MakeoverAccountabilityBuddy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverAccountabilityBuddy" ADD CONSTRAINT "MakeoverAccountabilityBuddy_buddyUserId_fkey" FOREIGN KEY ("buddyUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverAccountabilityBuddy" ADD CONSTRAINT "MakeoverAccountabilityBuddy_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeoverAccountabilityBuddy" ADD CONSTRAINT "MakeoverAccountabilityBuddy_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."MakeoverArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
