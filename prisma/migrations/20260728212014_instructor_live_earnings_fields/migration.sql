-- Extend Instructor, LiveClass, Payout, and Transaction to support the
-- instructor portal (live classes, earnings/payouts, analytics).
-- `updatedAt` is given a SQL DEFAULT so existing rows backfill safely;
-- Prisma still maintains it on every subsequent update.

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "pendingEarnings" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LiveClass" ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "currentParticipants" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxParticipants" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "meetingLink" TEXT,
ADD COLUMN     "recordingUrl" TEXT,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "instructorPayout" INTEGER;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClass" ADD CONSTRAINT "LiveClass_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
