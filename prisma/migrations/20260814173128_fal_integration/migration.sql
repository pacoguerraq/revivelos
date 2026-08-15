-- CreateEnum
CREATE TYPE "JobStage" AS ENUM ('RESTORING', 'ANIMATING', 'DONE');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "falRequestId" TEXT,
ADD COLUMN     "restoredUrl" TEXT,
ADD COLUMN     "stage" "JobStage" NOT NULL DEFAULT 'RESTORING';

-- CreateIndex
CREATE UNIQUE INDEX "Job_falRequestId_key" ON "Job"("falRequestId");

