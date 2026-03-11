-- CreateTable
CREATE TABLE "public"."MiniMasteryCourseCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "courseCompleted" BOOLEAN NOT NULL DEFAULT false,
    "courseCompletedAt" TIMESTAMP(3),
    "certificateDownloaded" BOOLEAN NOT NULL DEFAULT false,
    "certificateDownloadedAt" TIMESTAMP(3),
    "certificatePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiniMasteryCourseCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MiniMasteryCourseCompletion_userId_idx" ON "public"."MiniMasteryCourseCompletion"("userId");

-- CreateIndex
CREATE INDEX "MiniMasteryCourseCompletion_programId_idx" ON "public"."MiniMasteryCourseCompletion"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "MiniMasteryCourseCompletion_userId_programId_key" ON "public"."MiniMasteryCourseCompletion"("userId", "programId");

-- AddForeignKey
ALTER TABLE "public"."MiniMasteryCourseCompletion" ADD CONSTRAINT "MiniMasteryCourseCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiniMasteryCourseCompletion" ADD CONSTRAINT "MiniMasteryCourseCompletion_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
