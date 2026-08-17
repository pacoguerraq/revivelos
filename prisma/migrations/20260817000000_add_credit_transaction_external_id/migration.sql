-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_externalId_key" ON "CreditTransaction"("externalId");
