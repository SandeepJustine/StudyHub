/*
  Warnings:

  - Added the required column `updatedAt` to the `SupportTicket` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Experiment" DROP CONSTRAINT "Experiment_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Experiment" DROP CONSTRAINT "Experiment_moduleId_fkey";

-- AlterTable
ALTER TABLE "Experiment" ALTER COLUMN "courseId" SET DATA TYPE TEXT,
ALTER COLUMN "moduleId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "address" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "cancelledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SupportTicket" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "VirtualLab" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT NOT NULL,
    "labState" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VirtualLab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualLabAttempt" (
    "id" TEXT NOT NULL,
    "virtualLabId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "completedAt" TIMESTAMP(3),
    "score" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "observations" JSONB NOT NULL DEFAULT '[]',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VirtualLabAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VirtualLab_courseId_idx" ON "VirtualLab"("courseId");

-- CreateIndex
CREATE INDEX "VirtualLab_moduleId_idx" ON "VirtualLab"("moduleId");

-- CreateIndex
CREATE INDEX "VirtualLabAttempt_studentId_idx" ON "VirtualLabAttempt"("studentId");

-- CreateIndex
CREATE INDEX "VirtualLabAttempt_virtualLabId_idx" ON "VirtualLabAttempt"("virtualLabId");

-- AddForeignKey
ALTER TABLE "Experiment" ADD CONSTRAINT "Experiment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experiment" ADD CONSTRAINT "Experiment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualLab" ADD CONSTRAINT "VirtualLab_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualLab" ADD CONSTRAINT "VirtualLab_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualLabAttempt" ADD CONSTRAINT "VirtualLabAttempt_virtualLabId_fkey" FOREIGN KEY ("virtualLabId") REFERENCES "VirtualLab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualLabAttempt" ADD CONSTRAINT "VirtualLabAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
