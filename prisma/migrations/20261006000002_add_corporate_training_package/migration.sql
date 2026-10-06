-- CreateTable
CREATE TABLE IF NOT EXISTS "CorporateTrainingPackage" (
    "id" TEXT NOT NULL,
    "corporateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TrainingCategory" NOT NULL DEFAULT 'OTHER',
    "mode" "TrainingMode" NOT NULL DEFAULT 'ONLINE',
    "level" "TrainingLevel" NOT NULL DEFAULT 'ALL_LEVELS',
    "pricePerParticipant" INTEGER NOT NULL DEFAULT 0,
    "minimumParticipants" INTEGER NOT NULL DEFAULT 1,
    "maximumParticipants" INTEGER NOT NULL DEFAULT 50,
    "totalBudget" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'MWK',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 1,
    "schedule" JSONB,
    "curriculum" JSONB NOT NULL,
    "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "learningOutcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "materialsProvided" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certificationIncluded" BOOLEAN NOT NULL DEFAULT false,
    "instructorId" TEXT,
    "instructorName" TEXT,
    "instructorBio" TEXT,
    "location" JSONB,
    "onlinePlatform" "OnlinePlatform",
    "meetingLink" TEXT,
    "requirements" JSONB NOT NULL DEFAULT '{}',
    "status" "TrainingStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalNotes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "enrolledCount" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateTrainingPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CorporateTrainingPackage_corporateId_status_idx" ON "CorporateTrainingPackage"("corporateId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CorporateTrainingPackage_category_idx" ON "CorporateTrainingPackage"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CorporateTrainingPackage_startDate_idx" ON "CorporateTrainingPackage"("startDate");

-- AddForeignKey
ALTER TABLE "CorporateTrainingPackage" ADD CONSTRAINT IF NOT EXISTS "CorporateTrainingPackage_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "CorporateClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;