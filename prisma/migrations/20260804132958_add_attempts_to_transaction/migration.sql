-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "providerRef" TEXT,
ADD COLUMN     "refundedAmount" INTEGER,
ADD COLUMN     "refundedAt" TIMESTAMP(3);
