-- CreateTable
CREATE TABLE "public"."SundayProgressLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "card1WeeklyWin" BOOLEAN NOT NULL DEFAULT false,
    "card1DailyWin" BOOLEAN NOT NULL DEFAULT false,
    "card1NextWeekDone" BOOLEAN NOT NULL DEFAULT false,
    "card2Done" BOOLEAN NOT NULL DEFAULT false,
    "card3Done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SundayProgressLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SundayProgressLog_userId_idx" ON "public"."SundayProgressLog"("userId");

-- CreateIndex
CREATE INDEX "SundayProgressLog_programId_idx" ON "public"."SundayProgressLog"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "SundayProgressLog_userId_programId_date_key" ON "public"."SundayProgressLog"("userId", "programId", "date");

-- AddForeignKey
ALTER TABLE "public"."SundayProgressLog" ADD CONSTRAINT "SundayProgressLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
