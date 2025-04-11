-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'PROGRESS_VAULT';

-- CreateTable
CREATE TABLE "ProgressVault" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProgressVault_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgressVault_userId_idx" ON "ProgressVault"("userId");

-- CreateIndex
CREATE INDEX "ProgressVault_createdAt_idx" ON "ProgressVault"("createdAt");

-- AddForeignKey
ALTER TABLE "ProgressVault" ADD CONSTRAINT "ProgressVault_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
