-- AlterEnum
ALTER TYPE "CreditReason" ADD VALUE 'ADMIN_ADJUSTMENT';

-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN     "note" TEXT;

