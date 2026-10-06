CREATE TABLE "KycDocument" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "instructorId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER,
  "mimeType" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "KycDocument_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "KycDocument" ADD CONSTRAINT "KycDocument_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KycDocument" ADD CONSTRAINT "KycDocument_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "KycDocument_instructorId_idx" ON "KycDocument"("instructorId");
CREATE INDEX "KycDocument_status_idx" ON "KycDocument"("status");
CREATE INDEX "KycDocument_type_idx" ON "KycDocument"("type");
