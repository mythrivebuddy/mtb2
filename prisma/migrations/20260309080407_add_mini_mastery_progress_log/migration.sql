-- CreateTable
CREATE TABLE "public"."MiniMasteryProgressLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "actionResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiniMasteryProgressLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MiniMasteryProgressLog_userId_programId_idx" ON "public"."MiniMasteryProgressLog"("userId", "programId");

-- CreateIndex
CREATE UNIQUE INDEX "MiniMasteryProgressLog_userId_programId_dayNumber_key" ON "public"."MiniMasteryProgressLog"("userId", "programId", "dayNumber");

-- AddForeignKey
ALTER TABLE "public"."MiniMasteryProgressLog" ADD CONSTRAINT "MiniMasteryProgressLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiniMasteryProgressLog" ADD CONSTRAINT "MiniMasteryProgressLog_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
