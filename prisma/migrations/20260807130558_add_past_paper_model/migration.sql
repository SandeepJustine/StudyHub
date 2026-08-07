-- CreateTable
CREATE TABLE "PastPaper" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "examBoard" TEXT NOT NULL,
    "grade" TEXT,
    "year" INTEGER NOT NULL,
    "paperNumber" INTEGER NOT NULL DEFAULT 1,
    "duration" INTEGER NOT NULL DEFAULT 180,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "contentType" TEXT NOT NULL DEFAULT 'application/pdf',
    "markingSchemeUrl" TEXT,
    "courseId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PastPaper_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PastPaper_subject_idx" ON "PastPaper"("subject");

-- CreateIndex
CREATE INDEX "PastPaper_examBoard_idx" ON "PastPaper"("examBoard");

-- CreateIndex
CREATE INDEX "PastPaper_year_idx" ON "PastPaper"("year");

-- CreateIndex
CREATE INDEX "PastPaper_courseId_idx" ON "PastPaper"("courseId");

-- CreateIndex
CREATE INDEX "PastPaper_status_idx" ON "PastPaper"("status");

-- CreateIndex
CREATE INDEX "PastPaper_createdAt_idx" ON "PastPaper"("createdAt");

-- AddForeignKey
ALTER TABLE "PastPaper" ADD CONSTRAINT "PastPaper_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
